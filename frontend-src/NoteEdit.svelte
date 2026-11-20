<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import EasyMDE from "easymde";
  import { editNote } from "./api.js";

  export let note;
  const dispatch = createEventDispatcher();

  let title = note.title;
  let text = note.content;
  let editor = null;
  let textarea;
  let saving = false;
  let error = null;

  onMount(() => {
    editor = new EasyMDE({ element: textarea, initialValue: text, spellChecker: false, autoDownloadFontAwesome: true });
    editor.codemirror.on("change", () => {
      text = editor.value();
    });
  });

  onDestroy(() => {
    if (editor) editor.toTextArea();
  });

  async function onSave() {
    saving = true;
    error = null;
    try {
      const updated = await editNote(note._id, title, text);
      dispatch("saved", { id: updated._id });
    } catch (e) {
      error = e.message;
    } finally {
      saving = false;
    }
  }
</script>

<div class="uk-margin">
  <input class="uk-input" type="text" placeholder="Заголовок" bind:value={title} />
</div>
<div class="uk-margin">
  <textarea bind:this={textarea}></textarea>
</div>

{#if error}
  <div class="uk-alert uk-alert-danger"><p>{error}</p></div>
{/if}

<div class="uk-margin">
  <button class="uk-button uk-button-primary uk-margin-small-right" on:click={onSave} disabled={saving}>
    {saving ? "Сохранение..." : "Сохранить"}
  </button>
  <button class="uk-button uk-button-default" on:click={() => dispatch("cancel")}>Отмена</button>
</div>
