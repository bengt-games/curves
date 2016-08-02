import * as React from "react";
import * as ReactDOM from "react-dom";
import { Router, Route, Link, hashHistory } from "react-router"

import Lobby from "./components/Lobby.tsx"
import Game from "./components/Game.tsx"

ReactDOM.render(
  <Router history={hashHistory}>
    <Route path="/" component={Lobby} />
    <Route path="/game" component={Game} />
  </Router>,
  document.getElementById("content") as HTMLElement
)