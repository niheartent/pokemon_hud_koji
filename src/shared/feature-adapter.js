/* Local feature controls use the core's portrait and confirmation services. */
var kojiBaseRootBinding=hudBindRootDelegation;
hudBindRootDelegation=function(app){
  kojiBaseRootBinding(app);
  if(!app||app._kojiRelBound||typeof relHasPortrait!=='function')return;
  app._kojiRelBound=true;
  hudScope.listen(app,'click',function(e){
    var target=e.target&&e.target.closest?e.target:null;
    if(!target)return;
    var settings=target.closest('[data-rel-settings]'),del=target.closest('[data-rel-del-open]');
    if(!settings&&!del)return;
    e.preventDefault();e.stopPropagation();
    if(settings)openRelSettings();else openRelDelete();
  },true);
};
var kojiBasePageBinding=bindPageInteractions;
bindPageInteractions=function(){
  kojiBasePageBinding();
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
