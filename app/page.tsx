export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-400 mb-4">
           AI Trading System
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Sistema de IA para previsão de cor da próxima vela
        </p>
        <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-lg font-semibold mb-4 text-green-400">
             Sistema funcionando!
          </h2>
          <p className="text-sm text-gray-300">
            O erro 404 foi resolvido. O sistema está operacional.
          </p>
        </div>
      </div>
    </div>
  )
}
