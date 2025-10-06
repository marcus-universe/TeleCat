       
<template>
  <!-- Render only when shown and editor available -->
  <div v-if="show && editor">
    <!-- Fixed toolbar -->
    <div class="tc-editbar" role="toolbar" aria-label="Textformatierung">
      <div class="button-group">
        <button type="button"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
          :aria-pressed="editor.isActive('heading', { level: 1 })">
          H1
        </button>
        <button type="button"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
          :aria-pressed="editor.isActive('heading', { level: 2 })">
          H2
        </button>
        <button type="button"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
          :aria-pressed="editor.isActive('heading', { level: 3 })">
          H3
        </button>
        <button type="button"
          @click="editor.chain().focus().setParagraph().run()"
          :class="{ 'is-active': editor.isActive('paragraph') }"
          :aria-pressed="editor.isActive('paragraph')">
          P
        </button>

        <span class="divider" aria-hidden="true"></span>

        <button type="button"
          @click="editor.chain().focus().toggleBold().run()"
          :disabled="!editor.can().chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor.isActive('bold') }"
          :aria-pressed="editor.isActive('bold')"
          title="Bold">
          <Icons icon="bold" customclass="icon" />
        </button>
        <button type="button"
          @click="editor.chain().focus().toggleItalic().run()"
          :disabled="!editor.can().chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor.isActive('italic') }"
          :aria-pressed="editor.isActive('italic')"
          title="Italic">
          <Icons icon="italic" customclass="icon" />
        </button>
        <button type="button"
          @click="editor.chain().focus().toggleStrike().run()"
          :disabled="!editor.can().chain().focus().toggleStrike().run()"
          :class="{ 'is-active': editor.isActive('strike') }"
          :aria-pressed="editor.isActive('strike')"
          title="Strike">
          <Icons icon="strike" customclass="icon" />
        </button>

        <button type="button"
          @click="editor.chain().focus().toggleHighlight().run()"
          :disabled="!editor.can().chain().focus().toggleHighlight().run()"
          :class="{ 'is-active': editor.isActive('highlight') }"
          :aria-pressed="editor.isActive('highlight')"
          title="Mark">
          <Icons icon="mark" customclass="icon" />
        </button>

        <button type="button"
          @click="editor.chain().focus().toggleCodeBlock().run()"
          :class="{ 'is-active': editor.isActive('codeBlock') }"
          :aria-pressed="editor.isActive('codeBlock')"
          title="Codeblock">
          <Icons icon="code" customclass="icon" />
        </button>
        <button type="button"
          @click="editor.chain().focus().toggleBlockquote().run()"
          :class="{ 'is-active': editor.isActive('blockquote') }"
          :aria-pressed="editor.isActive('blockquote')"
          title="Blockquote">
          <Icons icon="blockquote" customclass="icon" />
        </button>

         <button type="button"
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          :aria-pressed="editor.isActive('bulletList')"
          title="Bullet List">
          <Icons icon="bulletlist" customclass="icon" />
        </button>
        <button type="button"
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          :aria-pressed="editor.isActive('orderedList')"
          title="Ordered List">
          <Icons icon="orderedlist" customclass="icon" />
        </button>
      </div>
    </div>

    <!-- Spacer to avoid overlap with fixed bar -->
    <div class="tc-editbar-spacer" aria-hidden="true"></div>
  </div>
</template>

<script lang="ts" setup>
import Icons from '~/components/Design/Icons.vue';
// Accept the TipTap editor instance and visibility flag
const props = defineProps<{ editor: any, show: boolean }>();
</script>

