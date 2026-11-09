import "./Loading.css";

function Loading() {
    return (
        <div className="loadingWrapper">
            <div className="loadingSpinner" role="status" aria-label="Carregando" />
        </div>
    );
}

export default Loading;