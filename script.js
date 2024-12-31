const BASE_URL = 'https://pokeapi.co/api/v2/pokemon';
const PER_PAGE = 14;

let simpleList = [];
let filteredList = [];
let currentPage = 1;

const htmlPokedex = document.getElementById('pokedex');
const pokeCache = {};

// Dicionário de cores para cada tipo de Pokémon

const typeColors = {
    bug: "#A8B820",
    dark: "#705848",
    dragon: "#7038F8",
    electric: "#F8D030",
    fairy: "#EE99AC",
    fighting: "#C03028",
    fire: "#F08030",
    flying: "#A890F0",
    ghost: "#705898",
    grass: "#78C850",
    ground: "#E0C068",
    ice: "#98D8D8",
    normal: "#A8A878",
    poison: "#A040A0",
    psychic: "#F85888",
    rock: "#B8A038",
    steel: "#B8B8D0",
    water: "#6890F0"
};


async function getPokeData(url) {
    if (pokeCache[url]) return pokeCache[url];

    const newCache = await fetch(url).then(response => response.json());

    pokeCache[url] = newCache;

    return newCache;
}

async function generateCards() {
    htmlPokedex.innerHTML = ''; // Limpa o conteúdo do Pokedex

    for (let i = 0; i < PER_PAGE; i++) {
        const pIn = PER_PAGE * (currentPage - 1) + i;
        if (pIn >= filteredList.length) break;

        const { index, name, url } = filteredList[pIn];
        const camelCaseName = name
            .split('-')
            .map((word) =>
                word
                    .split('')
                    .map((e, i) => (i === 0 ? e.toUpperCase() : e))
                    .join('')
            )
            .join(' ');
        const number = index.padStart(3, '0');

        const { sprites: { front_default }, types } = await getPokeData(url);

        // Cor de fundo do card com base no primeiro tipo
        const backgroundColor = typeColors[types[0].type.name] || "#FFF";

        htmlPokedex.innerHTML += `
            <div class="pokemon-card" style="background-color: #3a9fbf">
                <img src="${front_default ?? './camera-slash.svg'}" alt="${name}">
                <h3>${camelCaseName}</h3>
                <div class="types">
                    ${types.map((item) => `
                        <span style="background-color: ${typeColors[item.type.name] || "#ccc"};">
                            ${item.type.name}
                        </span>
                    `).join('')}
                </div>
                <p>#${number}</p>
            </div>
        `;
    }

    updatePaginationButtons(); // Atualiza os botões de paginação
}


function goToFirstPage() {
    currentPage = 1;
    generateCards();
}

function goToPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        generateCards();
    }
}

function goToNextPage() {
    const maxPage = Math.ceil(filteredList.length / PER_PAGE);
    if (currentPage < maxPage) {
        currentPage++;
        generateCards();
    }
}

function goToLastPage() {
    currentPage = Math.ceil(filteredList.length / PER_PAGE);
    generateCards();
}

function debounce(func, timeout = 300) {
    let timer;

    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

const onInputFilterChangeDebounce = debounce((filter) => {
    filteredList = simpleList.filter(({ index, name }) => index.includes(filter) ||
        name.includes(filter.toLowerCase().replace(' ', '-')));

    goToFirstPage();
});

function onInputFilterChange(event) {
    onInputFilterChangeDebounce(event.target.value);
}

// Load all Pokémon
fetch(BASE_URL)
    .then(response => response.json())
    .then(({ count }) => fetch(`${BASE_URL}?limit=${count}`))
    .then(response => response.json())
    .then(({ results }) => {
        simpleList = results.map((item, index) => ({ ...item, index: String(index + 1) }));
        filteredList = simpleList;
        return generateCards();
    })
    .catch(console.error);

function updatePaginationButtons() {
    const htmlPagination = document.getElementById('pagination');
    htmlPagination.innerHTML = '';

    const maxPage = Math.ceil(filteredList.length / PER_PAGE);

    htmlPagination.innerHTML += `
        <button onclick="goToFirstPage()">Primeira</button>
    `;

    if (currentPage > 1) {
        htmlPagination.innerHTML += `
            <button onclick="goToPreviousPage()">Anterior</button>
        `;
    }

    htmlPagination.innerHTML += `
        <input type="number" id="page-input" min="1" max="${maxPage}" value="${currentPage}" 
            style="width: 50px; text-align: center;" />
        <button onclick="goToPage()">Ir</button>
    `;

    if (currentPage < maxPage) {
        htmlPagination.innerHTML += `
            <button onclick="goToNextPage()">Próxima</button>
        `;
    }

    htmlPagination.innerHTML += `
        <button onclick="goToLastPage()">Última</button>
    `;
}

function goToPage() {
    const maxPage = Math.ceil(filteredList.length / PER_PAGE);
    const pageInput = document.getElementById('page-input');
    const selectedPage = parseInt(pageInput.value);

    if (!isNaN(selectedPage) && selectedPage >= 1 && selectedPage <= maxPage) {
        currentPage = selectedPage;
        generateCards();
    } else {
        alert(`Please enter a valid page number between 1 and ${maxPage}.`);
    }
}
