<script>
  import { onMount } from "svelte";
  import { push, location } from "svelte-spa-router";
  import { getNotes, getNote, deleteAllArchived } from "./api.js";
  import { getActiveNoteId, routerPrefix, routePatterns } from "./lib.js";
  import NoteCard from "./NoteCard.svelte";
  import NoteView from "./NoteView.svelte";
  import NoteEdit from "./NoteEdit.svelte";
  import NoteNew from "./NoteNew.svelte";
  import Progress from "./Progress.svelte";
  import { noteUpdates } from "./bus.js";

  const AGES = [
    { value: "week", label: "за неделю" },
    { value: "month", label: "за месяц" },
    { value: "threeMonths", label: "за 3 месяца" },
    { value: "all", label: "за всё время" },
    { value: "archive", label: "архив" },
  ];

  let age = "week";
  let search = "";
  let page = 1;
  let totalPages = 1;

  let notes = [];
  let loading = false;
  let error = null;
  let activeNote = null;
  let activeId = null;

  let pollTimer = null;

  const isNew = () => $location === `${routerPrefix}${routePatterns.new}`;
  const isEdit = () => $location.startsWith(`${routerPrefix}/`) && $location.endsWith("/edit");
  const isArchive = () => age === "archive";

  async function loadNotes() {
    loading = true;
    error = null;
    try {
      const res = await getNotes({ age, search, page });
      notes = res.items;
      totalPages = res.pages || 1;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  $: ($noteUpdates, loadNotes()); // перезагружаем список при каждом инкременте

  async function loadActive() {
    activeId = getActiveNoteId($location);
    if (!activeId) {
      activeNote = null;
      return;
    }
    try {
      activeNote = await getNote(activeId);
    } catch (e) {
      activeNote = null;
    }
  }

  let searchTimer = null;

  function onFilterChange() {
    page = 1;
    loadNotes();
  }

  function onSearchInput() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      page = 1;
      loadNotes();
    }, 300);
  }

  $: ($location, loadActive());

  onMount(() => {
    loadNotes();
    loadActive();
    pollTimer = setInterval(loadNotes, 20000);
    return () => clearInterval(pollTimer);
  });

  async function onDeleteAll() {
    if (!confirm("Удалить все архивные заметки?")) return;
    await deleteAllArchived();
    if (activeId) push("/");
    loadNotes();
  }

  function goNew() {
    push(`${routerPrefix}${routePatterns.new}`);
  }

  function onSaved(id) {
    if (id) push(`${routerPrefix}/${id}`);
    else push("/");
    loadNotes();
    loadActive();
  }
</script>

<div class="uk-grid">
  <div class="uk-width-1-3">
    <div class="uk-margin">
      <select class="uk-select" bind:value={age} on:change={onFilterChange}>
        {#each AGES as a}
          <option value={a.value}>{a.label}</option>
        {/each}
      </select>
    </div>

    <div class="uk-margin">
      <input
        class="uk-input"
        type="text"
        placeholder="поиск по заголовку"
        bind:value={search}
        on:input={onSearchInput}
      />
    </div>

    <div class="uk-margin">
      <button class="uk-button uk-button-primary uk-width-1-1" on:click={goNew}>+ Новая заметка</button>
    </div>

    {#if isArchive()}
      <div class="uk-margin">
        <button class="uk-button uk-button-danger uk-width-1-1" on:click={onDeleteAll}>Удалить все</button>
      </div>
    {/if}

    {#if loading && notes.length === 0}
      <Progress />
    {:else if notes.length === 0}
      <p class="uk-text-muted">Заметок нет</p>
    {:else}
      <ul class="uk-list uk-list-divider">
        {#each notes as note (note._id)}
          <li><NoteCard {note} active={note._id === activeId} /></li>
        {/each}
      </ul>

      {#if page < totalPages}
        <button
          class="uk-button uk-button-default uk-width-1-1"
          on:click={() => {
            page++;
            loadNotes();
          }}
        >
          Загрузить ещё
        </button>
      {/if}
    {/if}
  </div>

  <div class="uk-width-expand">
    {#if error}
      <div class="uk-alert uk-alert-danger"><p>{error}</p></div>
    {/if}

    {#if isNew()}
      <NoteNew on:saved={(e) => onSaved(e.detail.id)} on:cancel={() => push("/")} />
    {:else if isEdit() && activeNote}
      <NoteEdit
        note={activeNote}
        on:saved={(e) => onSaved(e.detail.id)}
        on:cancel={() => push(`${routerPrefix}/${activeNote._id}`)}
      />
    {:else if activeNote}
      <NoteView
        note={activeNote}
        on:deleted={() => {
          push("/");
          loadNotes();
        }}
      />
    {:else}
      <p class="uk-text-muted">Выберите заметку из списка или создайте новую</p>
    {/if}
  </div>
</div>
