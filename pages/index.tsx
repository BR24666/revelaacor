import { useState } from 'react'

export default function Home() {
  const [loading, setLoading] = useState(false)

  const startCollection = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/collect', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        alert('Coleta de dados iniciada com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao iniciar coleta:', error)
      alert('Erro ao iniciar coleta de dados')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-400">
            🚀 AI Trading System
          </h1>
          <button
            onClick={startCollection}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            {loading ? 'Iniciando...' : 'Iniciar Coleta'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-blue-400">
            🤖 Sistema de IA - Previsão de Cor da Próxima Vela
          </h2>
          <p className="text-gray-300 mb-6">
            Sistema de inteligência artificial para previsão da cor da próxima vela, 
            otimizado para trading na Ebinex com foco em pullbacks e máxima acurácia.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-green-400">Funcionalidades:</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Coleta de dados em tempo real</li>
                <li>• Análise de padrões de preço</li>
                <li>• Geração de sinais de trading</li>
                <li>• Previsão de cor da próxima vela</li>
                <li>• Integração com Supabase</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-yellow-400">APIs Disponíveis:</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• POST /api/collect - Iniciar coleta</li>
                <li>• GET /api/signals - Listar sinais</li>
                <li>• GET /api/analyze - Estatísticas</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
