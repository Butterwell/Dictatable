// import { init_canvas_embed } from './editor.js'
// init_canvas_embed(Quill)

// const quill = new Quill('#editor', {});

// quill.on('text-change', (delta, oldDelta, source) => {
//   if (source == 'api') {
//     console.log('An API call triggered this change.');
//   } else if (source == 'user') {
//       let width = 10
//       let height = 10
//       let draw = true
//       const cursorPosition = quill.getSelection() ? (quill.getSelection().index > 0 ? quill.getSelection().index : 0) : 0;
//       console.log(quill.getSelection().index)
//       quill.insertEmbed(cursorPosition, 'canvas-embed', { width, height, draw }, Quill.sources.API);
//       quill.setSelection(cursorPosition + 1); // Move cursor after the canvas
//       console.log(quill.getText())
//       console.log(oldDelta)
//       console.log(delta)
//   }
// });

export function init_canvas_embed(Quill) {
    const Embed = Quill.import('blots/embed');

    class CanvasBlot extends Embed {
      static create(value) {
    
        const canvas = document.createElement('canvas');
        canvas.setAttribute('width', value.width || 300);  // Use provided width or default
        canvas.setAttribute('height', value.height || 150); // Use provided height or default
        // canvas.style.border = '1px solid #ccc'; // removed, border is in css
    
        if (value.draw) {
           const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'lightblue';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'black';
            ctx.font = '10px Arial';
            ctx.fillText("D", 2, 8);
        }
    
        return canvas;
      }
    
      static value(node) {
        let width = 10
        let height = 10
        return { width, height }
      }
    }
    CanvasBlot.blotName = 'canvas-embed'; // Important: Give it a unique name
    CanvasBlot.tagName = 'div';        // Use a div, the wrapper
    
    Quill.register(CanvasBlot); // Register the Blot with Quill

    return Quill
}
