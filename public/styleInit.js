(function () {
  const savedTheme = localStorage.getItem('theme') || 'csbookclub';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();
