(function(){
  window.GUIDE_MODE = 'novice';
  window.resolveGuidePolicy = function(key){
    return { variant: 'supportive', hintTier: 2, label: 'Supportive' };
  };
})();
