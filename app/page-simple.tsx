export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">
          AI Trading System
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Sistema de IA para Previsão de Cor da Próxima Vela
        </p>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-green-400 mb-4">
            Status do Sistema
          </h2>
          <p className="text-gray-300">
            Sistema funcionando corretamente!
          </p>
        </div>
      </div>
    </div>
  )
}


