/* Seed external reference tables before the first render; valid online data wins. */
var kojiReferenceData=__KOJI_REFERENCE_DATA__;
function kojiReferenceReady(){
  if(typeof ensureMapLocations==='function'&&(!MAPS||!MAPS.length)){
    var source=JSON.parse(JSON.stringify(kojiReferenceData['map-locations']));
    source.maps.forEach(function(m){if(m.img)m.img=pkmRepoFirst(PKM_DATA_BASE+m.img);(m.islands||[]).forEach(function(is){if(is.img)is.img=pkmRepoFirst(PKM_DATA_BASE+is.img);});});
    MAPS_DATA=source.maps;MAPS=JSON.parse(JSON.stringify(MAPS_DATA));LOC_REGION=source.regions;
  }
  if(typeof ensureBadgeRules==='function'&&!Object.keys(BADGE_MAP).length){
    var rules=kojiReferenceData['badge-rules'].data;
    Object.keys(rules).forEach(function(k){BADGE_DIR[k]=rules[k].dir;BADGE_MAP[k]=rules[k].badges;});
    badgeMinHCache=0;
  }
  if(typeof ensureNearbySpecial==='function'&&!Object.keys(NEARBY_SPECIAL).some(function(k){return /^(legendary|mythical|ultra)$/.test(NEARBY_SPECIAL[k]);}))NEARBY_SPECIAL=Object.assign({},kojiReferenceData['nearby-special'].data);
  if(typeof ensureT2S==='function'&&!Object.keys(T2S_MAP).some(function(k){return k.length===1&&T2S_MAP[k];})){T2S_MAP=Object.assign({},kojiReferenceData['t2s-map'].data);t2sReady=true;}
  if(typeof ensureItemCategories==='function'&&!Object.keys(ITEM_CAT_MAP).some(function(k){return BAG_CAT_KEYS.indexOf(ITEM_CAT_MAP[k])>=0;}))ITEM_CAT_MAP=Object.assign({},kojiReferenceData['item-categories'].data);
}
/* Explicit user classifications take precedence over the automatic reference table. */
if(typeof pickBagCat==='function'){
  var kojiBagCategoryOverrides={},kojiBagCategoryKey='pk_koji_bag_categories_v1_'+chatKey();
  try{kojiBagCategoryOverrides=JSON.parse(localStorage.getItem(kojiBagCategoryKey)||'{}')||{};}catch(e){}
  var kojiBaseItemCategory=itemCategoryOf,kojiBasePickBagCat=pickBagCat;
  itemCategoryOf=function(name,aiType){return kojiBagCategoryOverrides[name]||kojiBaseItemCategory(name,aiType);};
  pickBagCat=function(name,cat){
    if(stat_data.背包&&stat_data.背包[name]&&BAG_CAT_KEYS.indexOf(cat)>=0){
      kojiBagCategoryOverrides[name]=cat;
      try{localStorage.setItem(kojiBagCategoryKey,JSON.stringify(kojiBagCategoryOverrides));}catch(e){}
    }
    return kojiBasePickBagCat(name,cat);
  };
}
