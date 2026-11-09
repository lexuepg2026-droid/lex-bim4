import "./EmptyState.css";

function EmptyState({ titulo, descricao, acao }) {
    return (
        <div className="emptyState">
            <p className="emptyStateTitulo">{titulo}</p>

            {descricao && <p className="emptyStateDescricao">{descricao}</p>}
            
            {acao && <div className="emptyStateAcao">{acao}</div>}
        </div>
    );
}

export default EmptyState;