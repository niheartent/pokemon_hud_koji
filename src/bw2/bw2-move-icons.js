/* Redrawn from the user-provided LZA icons; SVG geometry only. */
/* One attribute palette drives borders, chips and category artwork. */
function bw2SyncMoveColors(root){
  if(!root||!root.querySelectorAll)return;
  var selector='.dt-move-cell,.move-cell[data-mvtype]',nodes=Array.from(root.querySelectorAll(selector));
  if(root.matches&&root.matches(selector))nodes.unshift(root);
  nodes.forEach(function(node){
    var color=typeColor(node.getAttribute('data-mvtype')||'');
    if(node.style.getPropertyValue('--bw2-move-color')!==color)node.style.setProperty('--bw2-move-color',color);
    var cat=(node.getAttribute('data-mvcat')||'').trim(),art=BW2_MOVE_CATEGORY_ART[cat];
    node.querySelectorAll('img.move-cat-ic').forEach(function(img){
      if(!art)return;var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('class','move-cat-ic bw2-colored-category');svg.setAttribute('viewBox','0 0 50 40');svg.setAttribute('role','img');svg.setAttribute('aria-label',cat);svg.innerHTML=art;img.replaceWith(svg);
    });
  });
}
var BW2_MOVE_CATEGORY_ART={"特殊":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"3.8\"><ellipse cx=\"25\" cy=\"20\" rx=\"19.2\" ry=\"14.1\"/><ellipse cx=\"25\" cy=\"20\" rx=\"12.3\" ry=\"8.9\"/><ellipse cx=\"25\" cy=\"20\" rx=\"5.1\" ry=\"3.4\"/></g>","物理":"<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M25 1L30 11L43 6L38 16L50 20L38 24L43 34L30 29L25 39L20 29L7 34L12 24L0 20L12 16L7 6L20 11Z M25 9L22 16L14 12L17 18L10 20L17 22L14 28L22 24L25 31L28 24L36 28L33 22L40 20L33 18L36 12L28 16Z\"/>","变化":"<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M46 20A21 16 0 1 1 4 20A21 16 0 1 1 46 20Z M31 9C23 7 20 12 23 18C26 24 32 26 26 32C36 32 42 26 41 19C41 13 37 9 31 9Z\"/>"};
