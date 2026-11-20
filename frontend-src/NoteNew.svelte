<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import EasyMDE from "easymde";
  import { createNote } from "./api.js";

  const dispatch = createEventDispatcher();
  let title = "";
  let text = "";
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
      const note = await createNote(title, text);
      dispatch("saved", { id: note._id });
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
