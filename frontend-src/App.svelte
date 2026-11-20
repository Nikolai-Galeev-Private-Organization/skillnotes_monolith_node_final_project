<script>
  import { onMount, onDestroy } from "svelte";
  import Router from "svelte-spa-router";
  import Main from "./Main.svelte";
  import { routerPrefix, routePatterns } from "./lib.js";
  import { ping } from "./bus.js";

  let socket = null;
  let reconnectTimer = null;
  let disposed = false;
  let listeners = new Set();

  const notify = (evt) => listeners.forEach((fn) => fn(evt));

  function connect() {
    if (disposed) return;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    try {
      socket = new WebSocket(`${proto}://${location.host}/ws`);
      socket.onopen = () => {
        const username = document.getElementById("main").dataset.username;
        if (username) socket.send(JSON.stringify({ type: "auth", userId: username }));
      };
      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "note:updated") ping();
          notify(data);
        } catch (_) {}
      };
      socket.onclose = () => {
        if (disposed) return;
        reconnectTimer = setTimeout(connect, 3000);
      };
      socket.onerror = () => socket && socket.close();
    } catch (_) {
      reconnectTimer = setTimeout(connect, 3000);
    }
  }

  onMount(() => connect());

  onDestroy(() => {
    disposed = true;
    clearTimeout(reconnectTimer);
    if (socket) socket.close();
  });

  export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  const routes = {
    "/": Main,
    [`${routerPrefix}${routePatterns.new}`]: Main,
    [`${routerPrefix}${routePatterns.edit}`]: Main,
    [`${routerPrefix}${routePatterns.view}`]: Main,
  };
</script>

<Router {routes} />
