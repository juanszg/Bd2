const joinData = {
  students: [{ id: 1, name: 'Ana' }, { id: 2, name: 'Beto' }, { id: 3, name: 'Luz' }],
  submissions: [{ studentId: 1, activity: 'JOIN' }, { studentId: 1, activity: 'Subquery' }, { studentId: 3, activity: 'Modelo' }, { studentId: 4, activity: 'SQL básico' }]
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
function restartAnimation(node, className) {
  if (!node) return;
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
}

const sqlTokenPattern = /(\/\*[\s\S]*?\*\/|--[^\n]*|'(?:''|[^'])*'|"(?:""|[^"])*"|\b(?:SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|AS|AND|OR|NOT|IN|EXISTS|DISTINCT|GROUP|BY|HAVING|ORDER|ASC|DESC|LIMIT|OFFSET|WITH|INSERT|INTO|VALUES|UPDATE|SET|DELETE|IS|NULL|CREATE|CASE|WHEN|THEN|ELSE|END)\b|\b(?:AVG|COUNT|SUM|MIN|MAX)\s*(?=\()|\b\d+(?:\.\d+)?\b)/gi;
function highlightSqlCode(element) {
  const source = element.textContent;
  const escapeHtml = value => value.replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]);
  element.innerHTML = source.replace(sqlTokenPattern, token => {
    let type = 'sql-number';
    if (/^(\/\*|--)/.test(token)) type = 'sql-comment';
    else if (/^['"]/.test(token)) type = 'sql-string';
    else if (/^(AVG|COUNT|SUM|MIN|MAX)\b/i.test(token)) type = 'sql-function';
    else if (/^(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|AS|AND|OR|NOT|IN|EXISTS|DISTINCT|GROUP|BY|HAVING|ORDER|ASC|DESC|LIMIT|OFFSET|WITH|INSERT|INTO|VALUES|UPDATE|SET|DELETE|IS|NULL|CREATE|CASE|WHEN|THEN|ELSE|END)$/i.test(token)) type = 'sql-keyword';
    return `<span class="${type}">${escapeHtml(token)}</span>`;
  });
}
function highlightAllSql() { document.querySelectorAll('.sql-card pre code').forEach(highlightSqlCode); }

const joinModes = {
  inner: { title: 'INNER JOIN', description: 'Solo aparecen coincidencias. Beto queda fuera porque aún no tiene entrega.', sql: ['SELECT a.nombre, e.actividad', 'FROM alumnos AS a', 'INNER JOIN entregas AS e', '  ON e.alumno_id = a.alumno_id;'].join('\n') },
  left: { title: 'LEFT JOIN', description: 'Conserva todos los alumnos. Si falta una entrega, sus columnas aparecen como NULL.', sql: ['SELECT a.nombre, e.actividad', 'FROM alumnos AS a', 'LEFT JOIN entregas AS e', '  ON e.alumno_id = a.alumno_id;'].join('\n') },
  right: { title: 'RIGHT JOIN', description: 'Conserva todas las entregas. La fila sin alumno relacionado también aparece.', sql: ['SELECT a.nombre, e.actividad', 'FROM alumnos AS a', 'RIGHT JOIN entregas AS e', '  ON e.alumno_id = a.alumno_id;'].join('\n') },
  full: { title: 'FULL OUTER JOIN', description: 'Conserva ambos lados: parejas y filas que quedaron sin pareja.', sql: ['SELECT a.nombre, e.actividad', 'FROM alumnos AS a', 'FULL OUTER JOIN entregas AS e', '  ON e.alumno_id = a.alumno_id;'].join('\n') }
};

function joinedRows(mode) {
  const rows = [];
  const matchedSubmissions = new Set();
  joinData.students.forEach(student => {
    const matches = joinData.submissions.map((submission, index) => ({ submission, index })).filter(item => item.submission.studentId === student.id);
    if (matches.length) matches.forEach(({ submission, index }) => { matchedSubmissions.add(index); rows.push({ student: student.name, activity: submission.activity, match: 'sí' }); });
    else if (mode === 'left' || mode === 'full') rows.push({ student: student.name, activity: null, match: 'sin pareja' });
  });
  if (mode === 'right' || mode === 'full') joinData.submissions.forEach((submission, index) => {
    if (!matchedSubmissions.has(index)) rows.push({ student: null, activity: submission.activity, match: 'sin pareja' });
  });
  return rows;
}

function highlightJoinSources(mode) {
  const cards = document.querySelectorAll('.table-pair .data-card');
  if (cards.length < 2) return;
  const studentRows = cards[0].querySelectorAll('.data-line');
  const submissionRows = cards[1].querySelectorAll('.data-line');
  studentRows.forEach((row, index) => {
    const student = joinData.students[index];
    const matched = !!student && joinData.submissions.some(item => item.studentId === student.id);
    const included = matched || mode === 'left' || mode === 'full';
    row.classList.toggle('is-in', included);
    row.classList.toggle('is-out', !included);
  });
  submissionRows.forEach((row, index) => {
    const submission = joinData.submissions[index];
    const matched = !!submission && joinData.students.some(item => item.id === submission.studentId);
    const included = matched || mode === 'right' || mode === 'full';
    row.classList.toggle('is-in', included);
    row.classList.toggle('is-out', !included);
  });
}

function renderJoin(mode) {
  const config = joinModes[mode];
  const rows = joinedRows(mode);
  document.querySelectorAll('.join-tab').forEach(button => {
    const active = button.dataset.join === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  const venn = document.getElementById('venn-wrap');
  venn.dataset.join = mode;
  venn.setAttribute('aria-label', `Diagrama de filas incluidas por ${config.title}`);
  document.getElementById('join-title').textContent = config.title;
  document.getElementById('join-description').textContent = config.description;
  const countNode = document.getElementById('join-count');
  countNode.textContent = `${rows.length} ${rows.length === 1 ? 'fila' : 'filas'}`;
  restartAnimation(countNode, 'bump');
  restartAnimation(document.getElementById('join-description'), 'swap-in');
  restartAnimation(document.querySelector('.result-panel .sql-card pre'), 'swap-in');
  highlightJoinSources(mode);
  document.getElementById('join-sql').textContent = config.sql;
  highlightSqlCode(document.getElementById('join-sql'));
  document.getElementById('join-result').innerHTML = rows.map(row => `<tr class="${row.match === 'sin pareja' ? 'row-null' : ''}"><td>${row.student ?? '<em>NULL</em>'}</td><td>${row.activity ?? '<em>NULL</em>'}</td><td>${row.match}</td></tr>`).join('');
}

const subqueries = {
  scalar: {
    kicker: 'SUBCONSULTA ESCALAR', title: 'Primero calcula el promedio.',
    text: 'La consulta interior devuelve un número. La exterior lo compara contra el costo de cada curso.', result: '$850',
    sql: ['SELECT nombre, costo', 'FROM cursos', 'WHERE costo > (', '  SELECT AVG(costo)', '  FROM cursos', ');'].join('\n')
  },
  list: {
    kicker: 'SUBCONSULTA QUE DEVUELVE UNA LISTA', title: 'Primero reúne los IDs.',
    text: 'La consulta interior devuelve varios alumno_id. IN comprueba si cada alumno está en esa lista.', result: '1, 3',
    sql: ['SELECT nombre', 'FROM alumnos', 'WHERE alumno_id IN (', '  SELECT alumno_id', '  FROM entregas', '  WHERE calificacion >= 90', ');'].join('\n')
  },
  exists: {
    kicker: 'SUBCONSULTA CORRELACIONADA', title: 'Pregunta si hay una coincidencia.',
    text: 'EXISTS responde verdadero cuando encuentra una fila. La subconsulta lee el alumno_id de la consulta exterior.', result: 'sí / no',
    sql: ['SELECT a.nombre', 'FROM alumnos AS a', 'WHERE EXISTS (', '  SELECT 1', '  FROM entregas AS e', '  WHERE e.alumno_id = a.alumno_id', ');'].join('\n')
  }
};

function renderSubquery(type) {
  const item = subqueries[type];
  document.querySelectorAll('.sub-tab').forEach(button => {
    const active = button.dataset.sub === type;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.getElementById('sub-kicker').textContent = item.kicker;
  document.getElementById('sub-title').textContent = item.title;
  document.getElementById('sub-text').textContent = item.text;
  document.getElementById('sub-result').textContent = item.result;
  restartAnimation(document.getElementById('sub-result'), 'bump');
  restartAnimation(document.querySelector('.subquery-explain'), 'swap-in');
  restartAnimation(document.querySelector('.subquery-code pre'), 'swap-in');
  document.getElementById('subquery-sql').textContent = item.sql;
  highlightSqlCode(document.getElementById('subquery-sql'));
}

document.querySelectorAll('.join-tab').forEach(button => button.addEventListener('click', () => renderJoin(button.dataset.join)));
document.querySelectorAll('.sub-tab').forEach(button => button.addEventListener('click', () => renderSubquery(button.dataset.sub)));

document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const code = document.getElementById(button.dataset.copy).textContent;
  try {
    await navigator.clipboard.writeText(code);
    button.textContent = '¡Copiado!';
    button.classList.add('copied');
    window.setTimeout(() => { button.textContent = 'Copiar'; button.classList.remove('copied'); }, 1400);
  } catch {
    button.textContent = 'Selecciona el código';
    window.setTimeout(() => { button.textContent = 'Copiar'; }, 1800);
  }
}));

const routeKey = 'sql-sobremesa-route-v1';
let completedStops = new Set();
try { completedStops = new Set(JSON.parse(localStorage.getItem(routeKey) || '[]').filter(id => Number.isInteger(id) && id >= 0 && id < 6)); } catch { completedStops = new Set(); }
const progressCopy = ['La primera consulta empieza aquí.', 'Buen comienzo. Sigue conectando.', 'Ya sabes unir coincidencias.', 'Mira también lo que falta.', 'Una pregunta puede alimentar a otra.', 'Casi al final. Una última parada.', '¡Ruta completa! Ya puedes leer consultas anidadas.'];
function updateProgress() {
  const count = completedStops.size;
  const countNode = document.getElementById('progress-count');
  const barNode = document.getElementById('progress-bar');
  const messageNode = document.getElementById('progress-message');
  if (countNode) countNode.textContent = `${count} / 6`;
  if (barNode) barNode.style.width = `${(count / 6) * 100}%`;
  if (messageNode) messageNode.textContent = progressCopy[count];
  document.querySelectorAll('.stop-check').forEach(button => {
    const done = completedStops.has(Number(button.dataset.stop));
    button.textContent = done ? '✓' : '＋';
    button.closest('.route-stop').classList.toggle('completed', done);
    button.setAttribute('aria-pressed', String(done));
  });
  try { localStorage.setItem(routeKey, JSON.stringify([...completedStops])); } catch { /* La ruta sigue siendo usable sin almacenamiento local. */ }
}
document.querySelectorAll('.stop-check').forEach(button => button.addEventListener('click', () => {
  const id = Number(button.dataset.stop);
  completedStops.has(id) ? completedStops.delete(id) : completedStops.add(id);
  updateProgress();
}));

function updateScoreMeter() {
  const strip = document.querySelector('.score-strip');
  if (strip) strip.style.setProperty('--p', String(solvedExercises.size / 3));
}
function launchConfetti() {
  if (prefersReducedMotion) return;
  const strip = document.querySelector('.score-strip');
  const rect = strip.getBoundingClientRect();
  const box = document.createElement('div');
  box.className = 'confetti';
  box.style.left = `${rect.left + rect.width / 2}px`;
  box.style.top = `${Math.min(Math.max(rect.top, 80), window.innerHeight - 80)}px`;
  const colors = ['#ff9250', '#a183ed', '#f2eadb', '#6950b7'];
  for (let i = 0; i < 44; i++) {
    const piece = document.createElement('i');
    const spread = (Math.random() - .5) * Math.min(window.innerWidth, 700);
    piece.style.setProperty('--x', `${spread}px`);
    piece.style.setProperty('--yu', `${-(60 + Math.random() * 150)}px`);
    piece.style.setProperty('--yd', `${120 + Math.random() * 220}px`);
    piece.style.setProperty('--r', `${(Math.random() - .5) * 900}deg`);
    piece.style.setProperty('--c', colors[i % colors.length]);
    piece.style.setProperty('--d', `${Math.random() * .25}s`);
    box.append(piece);
  }
  document.body.append(box);
  window.setTimeout(() => box.remove(), 2400);
}
const answerKeys = { 0: 'inner', 1: 'leftnull', 2: 'gt' };
const explanations = {
  0: '¡Exacto! INNER JOIN conserva solo filas que cumplen la condición ON en ambos lados.',
  1: '¡Bien! LEFT JOIN mantiene a todos los alumnos; IS NULL identifica a quienes no encontraron entrega.',
  2: '¡Correcto! El promedio es un valor único, así que una comparación > puede usar una subconsulta escalar.'
};
const hints = {
  0: 'Pista: busca el JOIN que conserva solo la zona de coincidencia.',
  1: 'Pista: parte de alumnos para no perder a nadie; después revisa qué lado quedó en NULL.',
  2: 'Pista: el promedio devuelve un número. Piensa en una comparación numérica.'
};
const solvedExercises = new Set();
document.querySelectorAll('.exercise-card').forEach(card => {
  const id = Number(card.dataset.exercise);
  card.querySelectorAll('.answers button').forEach(button => button.addEventListener('click', () => {
    if (solvedExercises.has(id)) return;
    const correct = button.dataset.answer === answerKeys[id];
    card.querySelectorAll('.answers button').forEach(option => option.classList.remove('nope', 'shake'));
    const feedback = card.querySelector('.feedback');
    feedback.classList.remove('error');
    card.querySelectorAll('.answers button').forEach(option => {
      option.disabled = true;
      if (option.dataset.answer === answerKeys[id]) option.classList.add('correct');
    });
    if (correct) {
      button.classList.add('correct');
      feedback.textContent = explanations[id];
      solvedExercises.add(id);
      card.classList.add('solved');
      document.getElementById('score-detail').textContent = solvedExercises.size === 3 ? '¡Completaste la práctica!' : 'Una buena consulta empieza con una buena pregunta.';
    } else {
      button.classList.add('incorrect');
      button.classList.add('nope');
      restartAnimation(button, 'shake');
      feedback.textContent = hints[id];
      feedback.classList.add('error');
      card.querySelectorAll('.answers button').forEach(option => { option.disabled = false; option.classList.remove('incorrect'); });
    }
    document.getElementById('score-label').textContent = `${solvedExercises.size} de 3 retos resueltos`;
    updateScoreMeter();
    if (correct && solvedExercises.size === 3) launchConfetti();
  }));
});
document.getElementById('reset-exercises').addEventListener('click', () => {
  solvedExercises.clear();
  document.querySelectorAll('.exercise-card').forEach(card => {
    card.classList.remove('solved');
    card.querySelectorAll('.answers button').forEach(button => { button.disabled = false; button.classList.remove('correct', 'incorrect', 'nope', 'shake'); });
    const feedback = card.querySelector('.feedback');
    feedback.textContent = '';
    feedback.classList.remove('error');
  });
  document.getElementById('score-label').textContent = '0 de 3 retos resueltos';
  document.getElementById('score-detail').textContent = 'Cada intento suma experiencia.';
  updateScoreMeter();
});

const menuToggle = document.querySelector('.menu-toggle');
const headerAside = document.getElementById('header-aside');
const drawerBackdrop = document.querySelector('.drawer-backdrop');
function setDrawer(open) {
  menuToggle.setAttribute('aria-expanded', String(open));
  headerAside.classList.toggle('open', open);
  drawerBackdrop.hidden = !open;
  document.body.classList.toggle('drawer-open', open);
}
menuToggle.addEventListener('click', () => setDrawer(menuToggle.getAttribute('aria-expanded') !== 'true'));
headerAside.querySelector('.aside-close').addEventListener('click', () => setDrawer(false));
drawerBackdrop.addEventListener('click', () => setDrawer(false));
document.addEventListener('keydown', event => { if (event.key === 'Escape') setDrawer(false); });
headerAside.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setDrawer(false)));

const referenceExamples = {
  'example-join': ['SELECT e.nombre, a.nombre AS area', 'FROM empleados AS e', 'INNER JOIN areas AS a', '  ON a.area_id = e.area_id;'],
  'example-subquery': ['SELECT nombre, precio', 'FROM productos', 'WHERE precio > (', '  SELECT AVG(precio)', '  FROM productos', ');'],
  'example-both': ['SELECT c.nombre, p.total', 'FROM clientes AS c', 'JOIN pedidos AS p', '  ON p.cliente_id = c.cliente_id', 'WHERE p.total > (', '  SELECT AVG(total)', '  FROM pedidos', ');']
};
Object.entries(referenceExamples).forEach(([id, lines]) => { document.getElementById(id).textContent = lines.join('\n'); });

const extendedSubqueryExamples = {
  'theory-scalar': ['SELECT nombre, salario', 'FROM empleados', 'WHERE salario > (', '  SELECT AVG(salario)', '  FROM empleados', ');'],
  'theory-in': ['SELECT nombre', 'FROM clientes', 'WHERE id_cliente IN (', '  SELECT DISTINCT id_cliente', '  FROM pedidos', '  WHERE total > 5000', ');'],
  'theory-from': ['SELECT sub.departamento, sub.promedio_salario', 'FROM (', '  SELECT departamento, AVG(salario) AS promedio_salario', '  FROM empleados', '  GROUP BY departamento', ') AS sub', 'WHERE sub.promedio_salario > 25000;'],
  'theory-select': ['SELECT nombre, salario,', '  (SELECT AVG(salario) FROM empleados) AS promedio_general', 'FROM empleados;'],
  'theory-exists': ['SELECT c.nombre', 'FROM clientes AS c', 'WHERE EXISTS (', '  SELECT 1', '  FROM pedidos AS p', '  WHERE p.id_cliente = c.id_cliente', ');'],
  'theory-cte': ['WITH promedio_dept AS (', '  SELECT departamento, AVG(salario) AS promedio_salario', '  FROM empleados', '  GROUP BY departamento', ')', 'SELECT e.nombre, e.salario, p.promedio_salario', 'FROM empleados AS e', 'JOIN promedio_dept AS p', '  ON e.departamento = p.departamento', 'WHERE e.salario > p.promedio_salario;']
};
Object.entries(extendedSubqueryExamples).forEach(([id, lines]) => { document.getElementById(id).textContent = lines.join('\n'); });
highlightAllSql();

document.getElementById('reference-image').addEventListener('change', event => {
  const preview = document.getElementById('image-preview');
  preview.replaceChildren();
  const file = event.target.files?.[0];
  if (!file) return;
  const image = document.createElement('img');
  image.alt = 'Imagen de referencia para la actividad';
  image.src = URL.createObjectURL(file);
  preview.append(image);
});
function updatePrintDate() {
  const dateNode = document.getElementById('print-date');
  dateNode.textContent = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
}
document.getElementById('print-activity').addEventListener('click', () => { updatePrintDate(); window.print(); });
window.addEventListener('beforeprint', updatePrintDate);

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(element => {
    const siblings = [...element.parentElement.children].filter(child => child.classList.contains('reveal'));
    element.style.transitionDelay = `${Math.min(Math.max(siblings.indexOf(element), 0), 5) * 90}ms`;
    const release = () => { element.classList.add('is-done'); element.style.transitionDelay = ''; };
    element.addEventListener('transitionend', event => { if (event.target === element && event.propertyName === 'opacity') release(); });
    observer.observe(element);
  });
} else document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible', 'is-done'));

renderJoin('inner');
renderSubquery('scalar');
updateProgress();

/* =====================================================================
   UX/UI v2 · interacción: progreso, navegación activa, paralaje, luz
   ===================================================================== */
const progressBarTop = document.querySelector('.scroll-progress span');
const siteHeader = document.querySelector('.site-header');
const backToTop = document.querySelector('.back-to-top');
const navLinks = [...document.querySelectorAll('.header-aside nav a')];
const spySections = navLinks.map(link => document.querySelector(link.getAttribute('href')));
let scrollTicking = false;
function onScrollFrame() {
  scrollTicking = false;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
  if (progressBarTop) progressBarTop.style.transform = `scaleX(${ratio})`;
  siteHeader.classList.toggle('scrolled', window.scrollY > 20);
  backToTop.classList.toggle('show', window.scrollY > 700);
  let current = -1;
  spySections.forEach((section, index) => { if (section && section.getBoundingClientRect().top <= window.innerHeight * .35) current = index; });
  navLinks.forEach((link, index) => {
    const active = index === current;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => { if (!scrollTicking) { scrollTicking = true; window.requestAnimationFrame(onScrollFrame); } }, { passive: true });
window.addEventListener('resize', onScrollFrame);
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));
onScrollFrame();

if (finePointer) {
  document.querySelectorAll('.join-lab,.route-stop,.insight-card,.rule-card,.reference-card,.exercise-card,.process-flow>div,.theory-columns article,.subquery-demo,.subquery-intro,.dialect-note').forEach(element => {
    element.classList.add('spot');
    element.addEventListener('pointermove', event => {
      const rect = element.getBoundingClientRect();
      element.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      element.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  });
}

const heroSection = document.querySelector('.hero');
const heroArt = document.querySelector('.hero-art');
if (heroSection && heroArt && finePointer && !prefersReducedMotion) {
  heroSection.addEventListener('pointermove', event => {
    const rect = heroSection.getBoundingClientRect();
    heroArt.style.setProperty('--px', ((event.clientX - rect.left) / rect.width - .5).toFixed(3));
    heroArt.style.setProperty('--py', ((event.clientY - rect.top) / rect.height - .5).toFixed(3));
  });
  heroSection.addEventListener('pointerleave', () => { heroArt.style.setProperty('--px', 0); heroArt.style.setProperty('--py', 0); });
}

const uploadLabel = document.querySelector('.upload-control');
const referenceInput = document.getElementById('reference-image');
['dragenter', 'dragover'].forEach(type => uploadLabel.addEventListener(type, event => { event.preventDefault(); uploadLabel.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(type => uploadLabel.addEventListener(type, event => { event.preventDefault(); uploadLabel.classList.remove('dragging'); }));
uploadLabel.addEventListener('drop', event => {
  const file = event.dataTransfer?.files?.[0];
  if (!file || !file.type.startsWith('image/')) return;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  referenceInput.files = transfer.files;
  referenceInput.dispatchEvent(new Event('change'));
});
updateScoreMeter();
