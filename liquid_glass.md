To create a "liquid glass" effect with CSS, you combine several key properties that work together to mimic a frosted, refractive, and semi-transparent surface. 
The most effective techniques involve:
backdrop-filter: To blur the background behind the glass element.
RGBA colors: For a semi-transparent background and border.
box-shadow: To add depth and a glowing edge.
SVG filters: For more complex distortion and refraction effects, though this is a more advanced technique. 
Here is a basic CSS code example for creating a liquid glass card.
HTML
Create a container for the effect, placed over a background image or moving gradient. 
html
<div class="background">
  <div class="liquid-glass-card">
    <h2>Liquid Glass Effect</h2>
    <p>This is an example of a modern, blurred glass UI element created with CSS.</p>
  </div>
</div>
Используйте код с осторожностью.

CSS
This is the core of the effect. For a more compelling demonstration, place this element over a dynamic background, such as a video or animated gradient. 
css
/* Container for the background and glass card */
.background {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Use a background image or animation for a more dynamic effect */
  background: url("https://images.unsplash.com/photo-1588943211346-0908a1fb0b01") center/cover no-repeat;
}

/* The liquid glass card itself */
.liquid-glass-card {
  /* Basic card sizing and positioning */
  position: relative;
  width: 90%;
  max-width: 400px;
  padding: 2rem;
  border-radius: 20px;
  
  /* Semi-transparent background for the glass look */
  background: rgba(255, 255, 255, 0.1); 
  
  /* The core frosted glass effect */
  backdrop-filter: blur(8px); 
  -webkit-backdrop-filter: blur(8px);
  
  /* Subtle border and shadow for depth */
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  
  /* Add subtle glow and text styling */
  color: white;
  text-align: center;
  font-family: sans-serif;
  overflow: hidden; /* Important for containing pseudo-elements */
}

/* Highlight/liquid effect using a pseudo-element */
.liquid-glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  z-index: -1;
  opacity: 0.6;
  
  /* Subtle drop shadow and filter for a "wet" look */
  filter: blur(2px) drop-shadow(0 0 10px rgba(255, 255, 255, 0.6));
}
Используйте код с осторожностью.

Key properties explained
backdrop-filter: blur(): The most important property for this effect. It applies a visual effect (in this case, a blur) to the area behind an element. It works best in Chrome, Safari, and Edge.
background: rgba(): Creates a semi-transparent background color. The a in rgba stands for alpha, which controls the transparency.
border: 1px solid rgba(): Adds a subtle, semi-transparent border to create a defined edge for the glass.
box-shadow: Adds depth to the card, making it appear raised off the page. The example includes a standard box shadow and a more complex shadow on the pseudo-element for added dimension.
::before or ::after pseudo-elements: These are often used to create a second layer of effects, such as a subtle reflection, a highlight, or, in this case, the extra "liquid" glow with a filter.
SVG Filters: For a more advanced and realistic liquid effect that includes refraction and distortion, developers often turn to SVG filters like feTurbulence and feDisplacementMap. This method is more complex but offers more control.