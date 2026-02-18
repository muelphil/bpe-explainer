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