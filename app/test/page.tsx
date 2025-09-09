export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-400 mb-4">
          ✅ Aplicação Funcionando!
        </h1>
        <p className="text-xl text-gray-300">
          O AI Trading System está rodando corretamente no Vercel
        </p>
        <div className="mt-8">
          <a 
            href="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Voltar para o Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
