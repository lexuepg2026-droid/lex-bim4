const MINIMO_PARA_FILTRAR = 8;

function FiltroDeOpcoes({ valor, onChange, total, placeholder = "Digite para filtrar a lista..." }) {
    if (total < MINIMO_PARA_FILTRAR && !valor) return null;

    return (
        <input
            type="search"
            className="filtroOpcoes"
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            title="Filtra as opções da lista logo abaixo"
        />
    );
}

export default FiltroDeOpcoes;
