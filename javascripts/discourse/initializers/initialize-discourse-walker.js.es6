import DiscourseURL from "discourse/lib/url";
import { Promise } from "rsvp";
import { later, next, schedule } from "@ember/runloop";

function visit(url) {
  return new Promise(resolve => {
    DiscourseURL.routeTo(url);
    next(() => schedule("afterRender", resolve));
  });
}

function click(selector) {
  return new Promise(resolve => {
    schedule("afterRender", () => {
      document.querySelector(selector).click();
      next(() => schedule("afterRender", resolve));
    });
  });
}
function wait(duration) {
  return new Promise(resolve => {
    schedule("afterRender", () => {
      later(
        () => schedule("afterRender", resolve),
        parseInt(duration || 50, 10)
      );
    });
  });
}

function fillIn(selector, text) {
  return new Promise(resolve => {
    schedule("afterRender", () => {
      const input = document.querySelector(selector);
      $(input)
        .val(text)
        .change();
      next(() => schedule("afterRender", resolve));
    });
  });
}

function log(selector) {
  return new Promise(resolve => {
    schedule("afterRender", () => {
      console.log(selector, document.querySelector(selector));
      next(() => schedule("afterRender", resolve));
    });
  });
}

function _buildEditor() {
  const wrapper = document.createElement("div");
  wrapper.id = "discourse-walker";

  const textarea = document.createElement("textarea");
  textarea.setAttribute("autoresize", false);
  textarea.value = localStorage.getItem("discourse-walker");
  textarea.addEventListener("input", event =>
    localStorage.setItem("discourse-walker", event.target.value)
  );

  const actions = document.createElement("div");
  actions.classList.add("actions");

  const playButton = document.createElement("button");
  playButton.innerText = "play";
  playButton.classList.add("play-button");
  playButton.addEventListener("click", playStatements);

  const displayButton = document.createElement("button");
  displayButton.classList.add("display-button");

  if (localStorage.getItem("discourse-walker-shown")) {
    displayButton.innerText = "hide";
    wrapper.classList.add("is-shown");
  } else {
    displayButton.innerText = "walker";
    wrapper.classList.add("is-hidden");
  }

  displayButton.addEventListener("click", () => {
    wrapper.classList.remove("is-hidden");
    wrapper.classList.remove("is-shown");

    if (localStorage.getItem("discourse-walker-shown")) {
      displayButton.innerText = "walker";
      wrapper.classList.add("is-hidden");
      localStorage.removeItem("discourse-walker-shown");
    } else {
      displayButton.innerText = "hide";
      wrapper.classList.add("is-shown");
      localStorage.setItem("discourse-walker-shown", 1);
    }
  });

  const autoPlay = document.createElement("input");
  autoPlay.type = "checkbox";
  autoPlay.checked = localStorage.getItem("discourse-walker-autoplay")
    ? true
    : false;
  autoPlay.addEventListener("click", function(e) {
    if (e.target.checked) {
      localStorage.setItem("discourse-walker-autoplay", 1);
    } else {
      localStorage.removeItem("discourse-walker-autoplay");
    }
  });

  const label = document.createElement("label");
  label.innerText = "Autoplay: ";
  label.appendChild(autoPlay);

  actions.appendChild(label);
  actions.appendChild(playButton);
  actions.appendChild(displayButton);

  wrapper.appendChild(textarea);
  wrapper.appendChild(actions);

  return wrapper;
}

function processStatements(statements) {
  const firstStatement = statements.shift();
  if (firstStatement) {
    eval(firstStatement).then(() => processStatements(statements));
  }
}

function playStatements() {
  const statements = localStorage
    .getItem("discourse-walker")
    .split("\n")
    .filter(Boolean);

  processStatements(statements);
}

export default {
  name: "discourse-walker",

  initialize() {
    schedule("afterRender", () => {
      document.querySelector("body").appendChild(_buildEditor());

      if (localStorage.getItem("discourse-walker-autoplay")) {
        playStatements();
      }
    });
  }
};
