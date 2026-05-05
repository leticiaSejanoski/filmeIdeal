const apiKey = 'f93f8ed32ca9f310c852fe45c8996953';
const campoBuscarFilme = document.querySelector('#buscarFilme');
const btnBuscarFilme = document.querySelector('#buscar');

const generosDiv = document.getElementById('generos');
const btnTodos = document.getElementById('todos');

const filmesContainer = document.getElementById('filmesContainer');
const plataformasStream = document.querySelector('#plataformasStream');

const selectCI = document.querySelector('#classificacao');
const campoDataInicio = document.querySelector('#inicio');
const campoDataFim = document.querySelector('#fim');

const btnMaisPopular = document.getElementById('btn-desc');
const btnMenosPopular = document.getElementById('btn-asc');


let urlBaseAtual = '';
let plataformasInfoAtual = null;
let plataformasLogoAtual = [];

let paginaAtual = 1;
let carregando = false;

const capasCorrigidas = {
  277834: 'https://upload.wikimedia.org/wikipedia/pt/4/46/Moana_movie_poster_p_2016.jpg',
  1241982: 'https://m.media-amazon.com/images/S/pv-target-images/1e1b5b845d92882dbd3deefa1968f3589bac2f4b1035c8c1afeca76edc2b00b8.jpg',
  519182: 'https://br.web.img3.acsta.net/img/6c/71/6c71afa89fd8ed8999b3e04d8d794a0e.jpg',
  354912: 'https://play-lh.googleusercontent.com/Y8jmhSXKhy-FeQgfJLAPxNQJAbNxxbxFvq8g0DOz4pCBfPpB2vBiSFFvaFk4dbmDrELk'
};

let ordemPopularidade = 'popularity.desc';
let generoSelecionado = null;

async function filmesInicio() {
  paginaAtual = 1;
  selectCI.value = '';
  campoDataInicio.value = '';
  campoDataFim.value = '';
  generoSelecionado = null;

  let baseUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=pt-BR&certification_country=BR`;
  let url = addNaUrl(baseUrl);
  urlBaseAtual = baseUrl;

  try {
    let resposta = await fetch(url);
    let resJson = await resposta.json();
    filmesContainer.innerHTML = '';
    mostraFilmes(resJson.results);
  } catch (error) {
    console.error('Erro ao carregar filmes:', error);
  }
}

async function buscarFilmesComFiltros() {
  paginaAtual = 1;
  let baseUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=pt-BR&certification_country=BR`;
  urlBaseAtual = baseUrl;

  if (generoSelecionado) {
    baseUrl += `&with_genres=${generoSelecionado}`;
  }

  const url = addNaUrl(baseUrl);

  try {
    let res = await fetch(url);
    let respostaJson = await res.json();
    filmesContainer.innerHTML = '';
    mostraFilmes(respostaJson.results);
  } catch (error) {
    console.error('Erro ao buscar filme!', error);
  }
}

async function buscarFilmePorNome(nome) {
  const baseUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=pt-BR&certification_country=BR&query=${encodeURIComponent(nome)}`;
  const url = addNaUrl(baseUrl);
  urlBaseAtual = url;
  filmesContainer.innerHTML = '';
  paginaAtual = 1;

  const resposta = await fetch(url);
  const data = await resposta.json();
  mostraFilmes(data.results);
  campoBuscarFilme.value = '';
}

async function carregarGeneros() {
  const res = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=pt-BR`);
  const data = await res.json();
  data.genres.forEach(genero => {
    const botao = document.createElement('button');
    botao.textContent = genero.name;
    botao.addEventListener('click', () => {
      generoSelecionado = genero.id;
      buscarFilmesPorGenero(genero.id);
    });
    generosDiv.appendChild(botao);
  });
}

async function buscarFilmesPorGenero(idGenero) {
  let baseUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${idGenero}&language=pt-BR&certification_country=BR`;
  let url = addNaUrl(baseUrl);
  urlBaseAtual = baseUrl;

  try {
    const res = await fetch(url);
    const resultado = await res.json();
    filmesContainer.innerHTML = '';
    mostraFilmes(resultado.results);
  } catch (error) {
    console.error('Erro', error);
  }
}

function addNaUrl(baseUrl) {
  let url = baseUrl;
  url += `&sort_by=${ordemPopularidade}`;

  const classificacaoSelecionada = selectCI.value;
  const dataInicio = campoDataInicio.value;
  const dataFim = campoDataFim.value;

  if (classificacaoSelecionada) url += `&certification.gte=${classificacaoSelecionada}`;
  if (dataInicio) url += `&primary_release_date.gte=${dataInicio}`;
  if (dataFim) url += `&primary_release_date.lte=${dataFim}`;

  return url;
}

async function mostraDuracao(filmeId) {
  const url = `https://api.themoviedb.org/3/movie/${filmeId}?api_key=${apiKey}&language=pt-BR&certification_country=BR`;
  try {
    const resposta = await fetch(url);
    const resJson = await resposta.json();
    return resJson.runtime;
  } catch (err) {
    console.error('Erro ao buscar duração', err);
  }
}

function converteMinutosEmHoras(min) {
  const horas = Math.floor(min / 60);
  const minutosRestantes = min % 60;
  return `${horas}h ${minutosRestantes}m`;
}

function formataData(dataISO) {
  if (!dataISO) return 'Data desconhecida';
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function arredondaNota(nota) {
  let novaNota = nota.toFixed(1);
  if (novaNota == 0.0) return 'Este filme ainda não possui nenhuma avaliação :(';
  return novaNota;
}

async function buscarPlataformas(filmeId) {
  const url = `https://api.themoviedb.org/3/movie/${filmeId}/watch/providers?api_key=${apiKey}`;
  try {
    const res = await fetch(url);
    const resJson = await res.json();
    const resultadosBR = resJson.results?.BR;

    if (!resultadosBR) return { status: 'indisponivel', plataformas: [] };

    if (resultadosBR.flatrate) return { status: 'flatrate', plataformas: resultadosBR.flatrate };
    if (resultadosBR.rent) return { status: 'aluguel', plataformas: resultadosBR.rent };

    return { status: 'indisponivel', plataformas: [] };
  } catch (error) {
    console.error('Erro ao buscar plataformas:', error);
    return { status: 'erro', plataformas: [] };
  }
}

async function mostraFilmes(filmes) {
  const filmesFiltrados = filmes.filter(f => f.poster_path !== null);

  for (const filme of filmesFiltrados) {
    const respostaClassificacao = await fetch(`https://api.themoviedb.org/3/movie/${filme.id}/release_dates?api_key=${apiKey}`);
    const classificacaoJson = await respostaClassificacao.json();

    let classificacao = 'L';
    const brasil = classificacaoJson.results.find(p => p.iso_3166_1 === 'BR');
    if (brasil?.release_dates.length > 0) {
      classificacao = brasil.release_dates[0].certification || 'L';
    }

    let duracao = await mostraDuracao(filme.id);
    if (!duracao || duracao === 0 || isNaN(duracao)) continue;

    const data = formataData(filme.release_date);
    const div = document.createElement('div');
    div.className = 'filme';

    let plataformasInfo = await buscarPlataformas(filme.id);
    let plataformasHtml = '<div class="plataformas">';
    let plataformasLogo = [];

    plataformasInfo.plataformas.forEach(p => {
      const logo = p.logo_path ? `<img src="https://image.tmdb.org/t/p/w45${p.logo_path}" alt="${p.provider_name}" title="${p.provider_name}">` : p.provider_name;
      plataformasLogo.push(logo);
    });

    const primeiraPlataforma = plataformasLogo[0];
    const outrasPlataformas = plataformasLogo.slice(1).join('');

    if ((plataformasInfo.status === 'flatrate' || plataformasInfo.status === 'aluguel') && plataformasLogo.length > 1) {
      plataformasHtml += `Disponível agora em<br>${primeiraPlataforma}<div class="outrasPlataformas" style="display:none;">${outrasPlataformas}</div><div class="verMais">Ver mais</div>`;
    } else if (plataformasLogo.length === 1) {
      plataformasHtml += `Disponível agora em<br>${plataformasLogo[0]}`;
    } else {
      plataformasHtml += 'Não disponível para streaming no Brasil neste momento :(';
    }
    plataformasHtml += '</div>';
    

    const imagemUrl = capasCorrigidas[filme.id] || `https://image.tmdb.org/t/p/w200${filme.poster_path}`;
    const nota = arredondaNota(filme.vote_average);
    const duracaoFormatada = converteMinutosEmHoras(duracao);
    div.innerHTML = `<img src="${imagemUrl}" alt="${filme.title}" class="capa-filme">`;

    div.addEventListener('click', () => {
      const detalhes = `
        <h2>${filme.title}</h2>
        <img src="${imagemUrl}" alt="${filme.title}">
        <p><strong>Sinopse:</strong><br>${filme.overview || 'A sinopse foi pegar um refri, mas o filme já está te esperando com pipoca! 🍿'}</p>
        <p><strong>Lançamento:</strong> ${data}</p>
        <p><strong>Duração:</strong> ${duracaoFormatada}</p>
        <p><strong>Nota:</strong> ⭐${nota}</p>
        <p><strong>Classificação:</strong> ${classificacao}</p>
`;

      document.getElementById('fecharModal').addEventListener('click', () => {
        document.getElementById('modalFilme').style.display = 'none';
      });
      
      window.addEventListener('click', (event) => {
        const modal = document.getElementById('modalFilme');
        if (event.target === modal) {
          modal.style.display = 'none';
        }
      });


      document.getElementById('detalhesFilme').innerHTML = detalhes;
      document.getElementById('modalFilme').style.display = 'block';
    });
    div.style.backgroundSize = 'cover';
    div.style.backgroundRepeat = 'no-repeat';
    div.style.backgroundPosition = '150px center';
    
    filmesContainer.appendChild(div);
  }
}

document.addEventListener('click', function (e) {
  const element = e.target;
  if (element.classList.contains('verMais')) {
    const outrasPlataformas = element.previousElementSibling;
    const visible = outrasPlataformas.style.display === 'block';
    outrasPlataformas.style.display = visible ? 'none' : 'block';
    element.textContent = visible ? 'Ver mais' : 'Ver menos';
  }
});

async function carregarMaisFilmes() {
  if (carregando || !urlBaseAtual) return;
  carregando = true;
  paginaAtual++;

  const url = `${addNaUrl(urlBaseAtual)}&page=${paginaAtual}`;

  try {
    const resposta = await fetch(url);
    const resJson = await resposta.json();
    await mostraFilmes(resJson.results);
  } catch (error) {
    console.error('Erro ao carregar mais filmes', error);
  }
  carregando = false;
}

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const alturaJanela = window.innerHeight;
  const alturaTotal = document.body.scrollHeight;

  if (scrollTop + alturaJanela >= alturaTotal - 100) {
    carregarMaisFilmes();
  }
});

campoBuscarFilme.addEventListener('keydown', e => {
  if (e.key === 'Enter') buscarFilmePorNome(campoBuscarFilme.value);
});

btnBuscarFilme.addEventListener('click', () => {
  buscarFilmePorNome(campoBuscarFilme.value);
});

btnTodos.addEventListener('click', filmesInicio);
btnMaisPopular.addEventListener('click', () => {
  ordemPopularidade = 'popularity.desc';
  buscarFilmesComFiltros();
});
btnMenosPopular.addEventListener('click', () => {
  ordemPopularidade = 'popularity.asc';
  buscarFilmesComFiltros();
});

selectCI.addEventListener('change', buscarFilmesComFiltros);
campoDataInicio.addEventListener('change', buscarFilmesComFiltros);
campoDataFim.addEventListener('change', buscarFilmesComFiltros);

carregarGeneros();