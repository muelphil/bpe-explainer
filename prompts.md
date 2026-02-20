You are in an empty Vue project. I want to implement a demo for byte-pair encoding, where users can visualize and comprehend the byte pair encoding algorithm for the creation of vocabularies for large language models.

For this, I want to have different views that let the user provide settings, view steps in the algorithm, view the current vocabulary etc.

However, I first want to implement the training data/ test view, as it is the most important view to get visually right. Please create a new Vue component, that is put into App.vue. This component for now needs 2 sections vertically stacked.
* In the bottom, there are buttons to control the view and switch between different states (control panel)
* In the top, there should be the token view. Initially, it should be a contenteditable div, allowing me to provide test data. By default, it should be just 100 characters of Lorem Ipsum.

## Going from text to token view
* when the user presses a button in the control panel, the text view should merge in a token view. every single character in the training data should be wrapped into a span with class token for this.
  * token spans need to have a random color depending on their content - use hasing to create a random color for each token, where the same token content equals the same color
  * token spans also need a token id in the lower right bottom
  * this process needs to be transitioned/ animated, making the provided training data text go smoothly from the individual characters in the text to token spans
  * token spans need padding, margin, background color, token id -- all of which needs to be transitioned
* After transitioning, in the token view, the user should be able to click 2 tokens, selecting them. The selected tokens should have a rectangle around them in the background with a wider padding and a light red color, indicating selection -- however, this should not change the position of the tokens, it should be there as a backdrop. The 2 selected tokens could be wrapped in a selection span with negative margins to achieve this, but please use a standard working approach for this.
* When 2 tokens are selected, the user should be able to click a button in the control panel to merge them. This should:
  * make the token ids of the selected tokens invisible
  * transition to 0 margin and padding
    * on the right side for the left token and
    * on the left side for the right token
    * visually, this should click them together, making them look like 1 token
  * then after the animation is finished replacing the 2 tokens with 1 token and blending in the new token id

---

This is good, but there are several things that require improvement:
* The tokens are too big in comparison to the original text. Most importantly, they are too big vertically and should use much smalled padding vertically
* The animation going from text to token is too fast. Can you make that configurable in the control panel?
* the selected tokens need a backdrop, indicating that they are selected. Think of a wrapping span around both tokens that has a 2px padding, but a -2px margin and a light red background.
* The merging animation has one critical bug: When the 2 tokens are merged into one after the click animation, the new inserted token plays the character to token animation from the training data to token step. This should not be happening, the 2 tokens should be replaced with one after clicking together seemlessly

---

This is a notable improvement, but the selected tokens are still a problem that requires improvement.
* Selecting a single token should already display the background span around the single token.
* Selecting 2 tokens again plays the token insertion animation -- can you turn this animation on tokens off after the training data -> tokens transition in the first step happened?

---

* color merging
* more distinct colors


The following adjustments still need to be implemented:
* during the animation of the token merge, the background color of the 2 tokens that are being merged should be transitioning to the background color of the new resulting token, before it is replaced by the new resulting token.
* make sure that there is a modular token -> token background color function, that takes a token (string) and creates a deterministic color. You already implemented this, but tokens that have similar ids (id 15 and 16) should still have distinguished colors. Right now, tokens that are close have nearly the same color. Please  use some hashing prime color magic.
* when displaying text in tokens, replace spaces (" ") by "▁"

---

I have reviewed the implementation. There are a lot of areas that require improvement and update. Lets start with the side panel. It is cluttered. The idea is that the 3 panels (Frequency, Vocabulary and Steps) are collapsible in this side view and all of them together take up 100% of the height (minus the control panel with previous, play, next at the very bottom). If one is collapsed, the others can take up more width. The panels should use up the space, there sould not be a margin or gap. The panel headers need significantly different color, establishing them as headers. The headers need to display the core information (how many token, highest frequency pair, ...) regardless of whether the panel is collapsed or not -- with the goal that they provide the most vital information. More importantly, currently after uncollapsing the information in the detail view of the panel is not restored/ not displayed any longer.

Please fix all of these issues.


---

There still are a lot of issues on the sidebar.
Please refactor the following things:
* each of the panels should have the critical information they carry (top frequency token pair, vocabulary size & last added, current step) as the info UNDER the token header. Collapsing the panel should only hide all other information in the panel, not this critical first information. This way, the critical info will automatically have the same styling as in the panel.
* The steps panel needs to have its content updated. Steps and Progress sections need to take up 100% of the space. Steps section needs to use up the remaining space while the progress section is flex: 0 0;
* When advancing the steps, it should scroll the current step into view, so the user always sees the current step.

---

This is not exactly what I wanted.
* Vocabulary is okay
* Frequency shows the top token twice -- it shows the critical info top token pair at the top and then the top token pair again at the top of the list. The goal was that when collapsing, it would only show the first entry of the list of the frequency descending list. The list should be formatted accordingly so that it corresponds to what is currently the critical information: less padding, no number in the beginning, but the frequency bar at the end 
* Equally, the Steps when collapsed should not show the current step as additionally rendered information in different style, but simply display only the current step from the list of steps, not the other steps or the progress.

---

We next need to update some things regarding the visualization.
Please:
* make the tokens all have the same background color, but leave the code for the random color assignment, should I later decide to revert this.
* When the user hovers tokens in the vocabulary and the tokens in the token view are highlighted, they should simply assume a primary color, no wrapper with a border.
* When the user hovers a token pair in the frequency tab, the token pair needs to be highlighted -- this means both tokens need to be highlighted in the primary highlighting color and the token wrappers need to be applied stylings for left and right token:
.highlight-left {
  border-radius: 6px 0 0 6px;
  background: var(--light-primary);
  }

.highlight-right {
border-radius: 0 6px 6px 0;
background: var(--light-primary);
}


---

Next, we need to fix the steps and their visualization.
The steps need to highlight what they are doing in the main token view, similar to what happens when the user hovers token pairs or tokens in the control panels.
For the Select most frequent pair step, the most frequent pair needs to be highlighted.
For the Merge step, the newly merged token needs to be highlighted.
If the user hovers tokens or token pairs in the vocabulary or frequency control panel, this should "pause" highlighting by the step, highlighting the user selection instead, and resume when the user no longer hovers tokens/ token pairs in the control panel

---

We next need to extend the settings by a new setting: Merging restrictions -- either None or LLM.
LLM merging restrictions change the way tokens are "allowed" to be joined, specifically, in LLM vocabulary generation, space tokens may only be joined to the right, so the spaces may not be the second token in a token pair that is to be joined.
Please implement this setting by adding it to the settings. This should be taken into consideration in the computation of token pairs and frequencies, restricting what token pairs are possible based on this option.

---

TODOS:
* Step visualization
  * should use tokens classes,
* Control panel fix for flex
* Vocabulary use the same token-container/token visualization as in MainTokenView.vue
* merging restrictions ala LLM in settings
* compression rate info in vocabulary
* "LLM - Spaces can only join to the right" option being default
* settings persisted in localStorage
* dark mode using variables
* dark mode token fix
* byte token visualization (\0 instead of control token 0 weird questionmark)

---

Lets fix some bugs first:
* light and dark mode themes should be using :root level variables with all the colors used by the page, which they should be setting based on theme
* The vocabulary section should use the same token visualization as the one in the MainTokenView (although still 4 tokens per column)
  * extract a token-container, token, etc class, also introduce .token-container.small and .no-id, then use this same class across the MainTokenView (keep as is) and the Vocabulary, Frequency and Step control panels. For the control panels, use .small and .no-id to set the appropriate styling. Vocabulary and Frequency should use the same highlighting as the tokens in the MainTokenView


* last added: should not display anything after initialization
* Algorithm complete -- Compression-Rate: XYZ
* improve dark mode coloring for tokens
* Settings - reduce bunch of settings to just two modes: Original BPE and LLM BPE


---

Let's improve the App. Currently, there is an Initialization screen, that lets the user define the training data (InitializationPanel.vue). I would like to restructure this.

# MainView
Instead of showing the Initialization Panel first, directly show the app, but in an initial state, with a new MainView.vue component, that wraps the following 3 other views and conditionally shows them based on the state.
In this initial state ("training-data-definition"), the control side bars (Vocabulary, Frequency, Steps) are hidden. The MainView has a big "Byte-Pair Encoding Visualizer" heading (no subheading) at the top, see current InitializationPanel. Underneath there are 3 buttons: "Training Data", "Training" and "Validation". In the initial state, "Training" and "Validation" are disabled and "Training Data" is selected. When Training Data is finished, go to Training and activate Validation. Validation can be selected after training data is specified. Selecting Training Data again will go back to that step, disabling Training and Validation again.

# Training Data Definition
There should be a message along the lines "Define your Training Data or use one of the presets". Then, there should be PRESETS followed by several smaller buttons with preset options: Lorem Ipsum and 2 more random training data defaults. Lorem Ipsum should be selected by default, highlighting the button and showing the Lorem Ipsum text as training data. Let me specify them in a separate .ts file (trainingPresets.ts). Underneath, there should be a contenteditable div, which shows the training data. At the very bottom of the screen there should be a "Start Training" Button, which will then replace the Training Data Definition with the MainTokenView.

# Training
This should show the MainTokenView, renamed to TrainingView, as it is currently implemented

# Validation
The validation should show a split screen with the top being a content ediable div and the bottom being a tokenized representation fo the tops content. If the tokenization fails (vocabulary is not sufficient to tokenize) it should display error tokens for characters that result in this error. The 2 sections should have the headlines "Input" and "Tokenized Input (Compression Rate: XYZ%)".


---


This is not exactly what I wanted:
* The control sidebar should still use up the entire height and be displayed next to the MainView.
* The Training Data, Training and Validation Headers should be much smaller
* The MainView and Child views thereof should not use different background colors for different sections, just the default background color for everthing, not so many borders and hierarchy
* Skip the separation line under Input header and Tokenized Input header in validation 
* Training Data should not have a subheader, Training Data input should not have a border
* Start Training button should be at the very bottom
* 
---

Please next improve the step visualization. Replace "Select" title with "Select most frequent pair". In the content of merge and select steps, use small token display without token ids to display what is done in the step. Orient yourself on the Vocabulary display, with select most frequent pair basically showing the same as the most frequent pair display in the frequencies section under the step title and Merge step displaying token1 + token2 → token3 similar to the frequency display but with the resulting title on the right. 

---


* Settings rework
  * save settings in localStorage
  * implement settings service responsible for loading and applying settings
  * preset buttons: currently the preset "Apply LLM BPE" is being highlighted, but should not. It should just be 2 buttons, styled as the other buttons in the app (no border, blue background color)
* Last Step (Algorithm complete) should list stop condition
* Vocabulary: show tokens not used in Training Data as **slightly** greyed out


* Icon for Tab? Maybe not necessary if I integrate it
* Integration into personal website
* Side Nav rework
    * start in collapsed mode

---

Please improve the settings.
There should be a new first settings: Presets: Original BPE and LLM BPE, which should set all the other settings (Initial Vocabulary, Stop Condition, Merging Restriction) the ones corresponding with the given preset. The radio groups should be replaced with button groups, where one is activated. Implement a custom input component for this, button group (buttons are connected to each other, activated option is highlighted). Improve settings wording. Include an info icon for each option on the right side of the label, hovering shows explanation text. Reorder settings to put them into logical order -- UI settings, such as Dark Mode and Step Speed belong to the very bottom.

Button bars should span the entire width. LLM BPE = All 256 bytes, LLM Rules and Max Vocab Size. All LLM options should appear on the left side, BPE options on the right. Maximum Vocabulary Size should be visible disabled when Stop Condition "No Frequent Pairs" is selected. Dark Mode does not require info. "LLM BPE uses restrictions to ..." is inadequate. The idea is that Original BPE shows the original implementation from 1994 targeted for compression, while LLM BPE shows adjusted version used for building LLM Vocabularies based on training data.