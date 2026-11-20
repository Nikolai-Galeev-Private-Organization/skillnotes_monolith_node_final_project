<script>
  import { formatDate, formatSearchResult, routerPrefix } from "./lib.js";
  import { link } from "svelte-spa-router";

  export let note;
  export let active = false;
</script>

<a
  use:link
  href={`${routerPrefix}/${note._id}`}
  class="uk-display-block uk-padding-small uk-text-decoration-none"
  class:uk-background-primary={active}
  class:uk-light={active}
>
  <div class="uk-text-small uk-text-muted">{formatDate(note.createdAt)}</div>
  <div class="uk-text-bold">{@html formatSearchResult(note)}</div>
  {#if note.archived}
    <span class="uk-label uk-label-warning uk-margin-small-top">архив</span>
  {/if}
</a>
