<script context="module">
  import { marked } from "marked";
  export function renderMarkdown(md) {
    if (!md) return "";
    return marked.parse(md);
  }
</script>

<script>
  import { createEventDispatcher } from "svelte";
  import { push } from "svelte-spa-router";
  import { archiveNote, unarchiveNote, deleteNote, notePdfUrl } from "./api.js";
  import { routerPrefix } from "./lib.js";

  export let note;
  const dispatch = createEventDispatcher();

  async function onArchive() {
    await archiveNote(note._id);
    dispatch("deleted");
  }
  async function onUnarchive() {
    await unarchiveNote(note._id);
    dispatch("deleted");
  }
  async function onDelete() {
    if (!confirm("Удалить заметку?")) return;
    await deleteNote(note._id);
    dispatch("deleted");
  }
  function onEdit() {
    push(`${routerPrefix}/${note._id}/edit`);
  }
</script>

<div class="uk-margin">
  <button class="uk-button uk-button-primary uk-margin-small-right" on:click={onEdit}>Редактировать</button>

  {#if note.archived}
    <button class="uk-button uk-button-default uk-margin-small-right" on:click={onUnarchive}>Разархивировать</button>
    <button class="uk-button uk-button-danger uk-margin-small-right" on:click={onDelete}>Удалить</button>
  {:else}
    <button class="uk-button uk-button-default uk-margin-small-right" on:click={onArchive}>В архив</button>
  {/if}

  <a
    class="uk-button uk-button-secondary uk-margin-small-right"
    href={notePdfUrl(note._id)}
    target="_blank"
    rel="noopener">PDF</a
  >
</div>

<h1>{note.title}</h1>
<article class="uk-article">
  <div>{@html renderMarkdown(note.content)}</div>
</article>
