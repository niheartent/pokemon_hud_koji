/* Local feature controls use the core's portrait and confirmation services. */
var kojiBaseRootBinding=hudBindRootDelegation;
hudBindRootDelegation=function(app){
  kojiBaseRootBinding(app);
  if(!app||app._kojiRelBound)return;
  app._kojiRelBound=true;
  hudScope.listen(app,'click',function(e){
    var target=e.target&&e.target.closest?e.target:null;
    if(!target)return;
    if(kojiBagClick(e))return;
    var settings=target.closest('[data-rel-settings]'),del=target.closest('[data-rel-del-open]');
    if(!settings&&!del)return;
    e.preventDefault();e.stopPropagation();
    if(settings)openRelSettings();else openRelDelete();
  },true);
};
var kojiBasePageBinding=bindPageInteractions;
bindPageInteractions=function(){
  kojiBasePageBinding();
  if(pageOverlay.querySelector('#tc-def-wrap')&&typeof typeChartSwitchMode==='function')typeChartSwitchMode('def');
  if(!pageOverlay._kojiBagBound){pageOverlay._kojiBagBound=true;hudScope.listen(pageOverlay,'click',kojiBagClick,true);}

  if(typeof relHasPortrait!=='function')return;
  pageOverlay.querySelectorAll('[data-rel-settings]').forEach(function(button){
    if(button._kojiRelBound)return;button._kojiRelBound=true;
    button.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openRelSettings();});
  });
};

// Portrait edits replace relationship markup; bind controls on the new nodes.
if(typeof refreshRelViews==='function'){
  var kojiBaseRelRefresh=refreshRelViews;
  refreshRelViews=function(){
    kojiBaseRelRefresh();
    if(pageOverlay&&pageOverlay.classList.contains('open')&&pageOverlay.querySelector('.rel-item'))bindPageInteractions();
  };
}

// Block pending/descriptionless rows including their image-loader placeholders.
// Valid rows dispatch using the resolved row identity, while discard/TM stay native.
function kojiBagClick(e){
  if(typeof resolveBagItemClick!=='function')return false;
  var target=e.target&&e.target.closest?e.target:null;
  var row=target&&target.closest('.item-entry');
  if(!row||target.closest('[data-bag-discard],[data-tm]'))return false;
  e.preventDefault();e.stopImmediatePropagation();
  if(!row.classList.contains('item-no-click')&&!row.hasAttribute('data-bag-item')&&row.hasAttribute('data-item')&&itemClickEnabled)showItemInfo(row.getAttribute('data-item'),true,row.getAttribute('data-item-en')||'');
  return true;
}
