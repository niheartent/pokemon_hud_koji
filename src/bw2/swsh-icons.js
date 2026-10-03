/* Outlined HUD pictograms. Geometry is shared by both themes. */
function swshIcon(key,size){
  var art={
    bag:'<g transform="rotate(-12 24 24)"><path d="M15 18.5v-3.2c0-6 3.7-10 9-10s9 4 9 10v3.2"/><path d="M13.5 18c-3 .2-5 2.5-5 5.7V38c0 3 2.4 5.4 5.4 5.4h20.2c3 0 5.4-2.4 5.4-5.4V23.7c0-3.2-2-5.5-5-5.7"/><path d="M16.2 17.8c1.9-3.4 4.3-4.9 7.8-4.9s5.9 1.5 7.8 4.9M13.8 19.2v7.1c0 3.3 3 5.8 6.1 5.8h8.2c3.2 0 6.1-2.5 6.1-5.8v-7.1"/><path class="swsh-icon-detail" d="M20.4 21.5c1.8-1.3 5.4-1.3 7.2 0M20 26h8m-4-5v9M8.5 25l-3 2.3v9.2l3 2.2M39.5 25l3 2.3v9.2l-3 2.2"/></g>',
    box:'<g transform="rotate(-5 24 24)"><rect x="5" y="9" width="38" height="26" rx="5"/><path d="M5 29h38M12 35v4h24v-4M12 39h24"/><circle cx="16" cy="19" r="4.8"/><path class="swsh-icon-detail" d="M16 14.2v9.6m-4.8-4.8h9.6M27 17h10m-10 5h7"/></g>',
    rel:'<g transform="rotate(-10 24 24)"><path d="M8 9h32v28H8z"/><path d="M13 32h22M15 16a4.2 4.2 0 1 1 8.4 0 4.2 4.2 0 0 1-8.4 0zM12.5 27c.4-4.1 3-6.1 6.7-6.1s6.3 2 6.7 6.1"/><path class="swsh-icon-detail" d="M29 16h6m-6 4h6m-6 4h4"/></g>',
    rivals:'<path d="M10 36c0-5.3 3.1-8.7 8.5-9.4M38 36c0-5.3-3.1-8.7-8.5-9.4"/><circle cx="17" cy="19" r="5"/><circle cx="31" cy="19" r="5"/><path d="M8.5 37h31M23.5 35v-4.5m1-5.7 3-3"/><path class="swsh-icon-detail" d="m10 11 4-3m20 0 4 3"/>',
    breeding:'<path d="M24 5c8 0 15 13 15 24a15 15 0 0 1-30 0C9 18 16 5 24 5z"/><path class="swsh-icon-detail" d="M15 28c1 6.2 4.3 9.4 9 9.4m7-22 2.2 4.7m-14.1 2.4 2.3-2.6 2.5 2.1 2.3-2.1 2.6 2.6"/>',
    pokedex:'<g transform="rotate(-15 24 24)"><rect x="10" y="6" width="31" height="35" rx="5"/><path d="M10 15H7.5a3 3 0 0 0-3 3v19a3 3 0 0 0 3 3H10M15 17h21v13H15z"/><circle cx="23" cy="23.5" r="4.5"/><path class="swsh-icon-detail" d="M16 11h12m4 0h3M15 34h11m4 0h6M16 38h5m4 0h4"/></g>',
    badge:'<path d="M24 5 29 11 37 9 36 19 42 24 36 29 37 39 29 37 24 43 19 37 11 39 12 29 6 24 12 19 11 9 19 11z"/><path d="M24 14 29 19 34 24 29 29 24 34 19 29 14 24 19 19z"/><path class="swsh-icon-detail" d="M24 17v14m-7-7h14"/>',
    map:'<g transform="rotate(-8 24 24)"><path d="M5 11 17 7l14 4 12-4v31l-12 4-14-4-12 4zM17 7v31M31 11v31"/><circle cx="25" cy="21" r="4"/><path class="swsh-icon-detail" d="m24.5 25 5 8m-11-6-5 6m23-14 3-2"/></g>',
    settings:'<path d="M8.9 4.52 10.25 2.05 13.75 2.05 15.1 4.52 17.79 3.73 20.27 6.21 19.48 8.9 21.95 10.25 21.95 13.75 19.48 15.1 20.27 17.79 17.79 20.27 15.1 19.48 13.75 21.95 10.25 21.95 8.9 19.48 6.21 20.27 3.73 17.79 4.52 15.1 2.05 13.75 2.05 10.25 4.52 8.9 3.73 6.21 6.21 3.73z" transform="scale(2)"/><circle cx="24" cy="24" r="5.4"/><circle class="swsh-icon-detail" cx="24" cy="24" r="2.2"/>',
    typechart:'<circle cx="12.5" cy="24" r="8"/><circle cx="35.5" cy="24" r="8"/><path d="M20.5 24h7m-3-3 3 3-3 3"/><path class="swsh-icon-detail" d="M9 24h7m-3.5-3.5v7M32 24h7"/>',
    pin:'<path d="M24 43S10 28 10 19a14 14 0 0 1 28 0c0 9-14 24-14 24z"/><circle cx="24" cy="19" r="5.5"/>',
    news:'<g transform="rotate(-6 24 24)"><path d="M9 7h31v32H12a6 6 0 0 1-6-6V13h3"/><path d="M9 33H6m8-20h9v9h-9z"/><path class="swsh-icon-detail" d="M28 14h8m-8 4h8m-22 9h22m-22 5h18"/></g>',
    globe:'<circle cx="24" cy="24" r="18"/><path d="M6 24h36M24 6c-6 5-9 11-9 18s3 13 9 18M24 6c6 5 9 11 9 18s-3 13-9 18"/><path class="swsh-icon-detail" d="M10 15h28m-28 18h28"/>',
    schedule:'<rect x="7" y="10" width="34" height="32" rx="3"/><path d="M7 19h34M15 6v8M33 6v8"/><path class="swsh-icon-detail" d="M14 26h6m7 0h6m-19 7h6m7 0h6"/>',
    command:'<rect x="5" y="11" width="38" height="27" rx="5"/><path d="M11 18h4m5 0h4m5 0h4M11 25h4m5 0h4m5 0h4M16 32h16"/><path class="swsh-icon-detail" d="M37 18h2m-2 7h2"/>',
    training:'<path d="M24 8v31m-9-9 9 9 9-9M9 13h30M9 13l4 9h22l4-9"/><path d="M13 22c0 5 4.3 8 11 8s11-3 11-8"/><path class="swsh-icon-detail" d="M18 13v4m12-4v4M19 43h10"/>',
    dodge:'<path d="M7 29h18l-5 6m5-6-5-6M11 17h30m-8-6 8 6-8 6M6 39h31"/><path class="swsh-icon-detail" d="M7 22h8m19 7h7"/>',
    initiative:'<path d="M28 4 11 27h12l-3 17 17-24H25z"/><path class="swsh-icon-detail" d="m25 13-6 10h9m-2 3-3 9"/>',
    guard:'<path d="M24 5 40 11v12c0 11-6.8 17.5-16 21-9.2-3.5-16-10-16-21V11z"/><path d="m15 24 6 6 12-13"/><path class="swsh-icon-detail" d="M13 15 24 11l11 4"/>',
    revive:'<path d="M24 43c-9 0-15-5.5-15-14 0-8 5-13.5 6-20 4 2.5 6 6.5 5.5 11C24 16 26 10 27 5c8 7 12 14 12 23 0 9-6 15-15 15z"/><path d="M24 41c-4.5 0-7.5-3-7.5-7.3 0-4.1 3-6.6 4.2-9.7 3.4 2 4.4 5 4 7.3 2.3-2 3.4-4.7 3.7-7.2 3.8 3.3 5.6 6.6 5.6 10.1 0 4.4-3 7.5-7.8 7.5z"/>',
    mega:'<path d="m24 4 4.1 10.6L39 10l-4.6 10.9L45 25l-10.6 4.1L39 40l-10.9-4.6L24 46l-4.1-10.6L9 40l4.6-10.9L3 25l10.6-4.1L9 10l10.9 4.6z"/><path d="m17 31 2-12 5 8 5-8 2 12"/><path class="swsh-icon-detail" d="M18.5 34h11"/>',
    clash:'<path d="M7 8 34 35m-3 4 8-8M41 8 14 35m3 4-8-8"/><path d="m6 5 8 3-5 5zM42 5l-8 3 5 5z"/><path class="swsh-icon-detail" d="M19 20 28 29m1-9-9 9"/>',
    help:'<circle cx="24" cy="24" r="18"/><path d="M18.5 18a5.5 5.5 0 1 1 9.5 3.7c-2.6 2.1-4 3.2-4 6.3"/><circle cx="24" cy="34" r="1"/>',
    arrow:'<path d="M7 24h34m-12-12 12 12-12 12"/>',
    chevron:'<path d="m18 9 12 15-12 15"/>'
  };
  var px=Math.max(14,Math.min(48,Number(size)||24));
  return '<svg class="swsh-icon swsh-icon-'+key+'" width="'+px+'" height="'+px+'" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(art[key]||art.pokedex)+'</svg>';
}
