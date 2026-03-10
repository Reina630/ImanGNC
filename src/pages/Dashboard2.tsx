import { Mail, Inbox, Send, Clock, Check, X, FileText, Archive, HourglassIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Données statiques pour le dashboard
const statsData = {
  entrants: 125,
  sortants: 89,
  enAttente: 34,
  traites: 210,
  rejetes: 12
};

// Données pour le graphique en donut
const chartData = [
  { name: 'Entrants', value: 32, color: '#2563eb' },
  { name: 'Traités', value: 35, color: '#16a34a' },
  { name: 'En Attente', value: 18, color: '#f97316' },
  { name: 'Rejetés', value: 15, color: '#dc2626' }
];

// Activités récentes
const recentActivities = [
  {
    id: 1,
    icon: Mail,
    iconBg: 'bg-blue-500',
    title: 'Nouveau courrier reçu de la Mairie',
    time: 'Il y a 5 minutes'
  },
  {
    id: 2,
    icon: Archive,
    iconBg: 'bg-green-500',
    title: 'Dossier archivé: Projet X finalisé',
    time: 'Il y a 20 minutes'
  },
  {
    id: 3,
    icon: Clock,
    iconBg: 'bg-orange-500',
    title: 'Courrier en attente de validation',
    time: 'Il y a 1 heure'
  },
  {
    id: 4,
    icon: X,
    iconBg: 'bg-red-500',
    title: 'Document refusé par la direction',
    time: 'Il y a 2 heures'
  }
];

// Courriers en attente
const courriersEnAttente = [
  {
    id: 1,
    reference: 'CR-2022-145',
    expediteur: "Ministère de l'Intérieur",
    objet: 'Demande de consultation',
    date: '12/04/2024',
    statut: 'En Attente'
  },
  {
    id: 2,
    reference: 'CR-2022-087',
    expediteur: 'Société Alpha',
    objet: 'Contrat de service',
    date: '10/04/2024',
    statut: 'En Attente'
  }
];

const COLORS = ['#2563eb', '#16a34a', '#f97316', '#dc2626'];

// Custom label pour le graphique
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="font-semibold text-sm"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Dashboard2() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      {/* <div className="bg-[#2c5282] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Gestion de Courrier</h1>
        </div>
      </div> */}

      {/* Contenu principal */}
      <div className="p-6 space-y-6">
        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Courriers Entrants */}
          <div className="bg-[#2563eb] text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <Inbox className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm opacity-90 mb-1">Courriers Entrants</p>
                <p className="text-4xl font-bold">{statsData.entrants}</p>
              </div>
            </div>
          </div>

          {/* Courriers Sortants */}
          <div className="bg-[#16a34a] text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <Send className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm opacity-90 mb-1">Courriers Sortants</p>
                <p className="text-4xl font-bold">{statsData.sortants}</p>
              </div>
            </div>
          </div>

          {/* En Attente */}
          <div className="bg-[#f97316] text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <HourglassIcon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm opacity-90 mb-1">En Attente</p>
                <p className="text-4xl font-bold">{statsData.enAttente}</p>
              </div>
            </div>
          </div>

          {/* Courriers Traités */}
          <div className="bg-[#16a34a] text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <Check className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm opacity-90 mb-1">Courriers Traités</p>
                <p className="text-4xl font-bold">{statsData.traites}</p>
              </div>
            </div>
          </div>

          {/* Courriers Rejetés */}
          <div className="bg-[#dc2626] text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <X className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm opacity-90 mb-1">Courriers Rejetés</p>
                <p className="text-4xl font-bold">{statsData.rejetes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques et Activités Récentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statistiques avec graphique */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-[#2c5282] mb-6">Statistiques</h2>
            
            <div className="flex items-center justify-between">
              {/* Graphique en donut */}
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={90}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Légende */}
              <div className="w-1/2 space-y-3">
                {chartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totaux en bas */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Courriers</p>
                <p className="text-2xl font-bold text-gray-900">456</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">En Attente</p>
                <p className="text-2xl font-bold text-orange-600">{statsData.enAttente}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Traités</p>
                <p className="text-2xl font-bold text-green-600">{statsData.traites}</p>
              </div>
            </div>
          </div>

          {/* Activités Récentes */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#2c5282]">Activités Récentes</h2>
              <button className="text-sm text-gray-500 hover:text-gray-700">Add •</button>
            </div>

            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className={`p-3 ${activity.iconBg} text-white rounded-lg`}>
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table Courriers en Attente */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-[#2c5282]">Courriers en Attente</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Référence ▼
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Expéditeur ▴
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Objet
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Date ▼
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {courriersEnAttente.map((courrier) => (
                  <tr key={courrier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {courrier.reference}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {courrier.expediteur}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {courrier.objet}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {courrier.date}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-orange-500 text-white text-sm rounded-full">
                        {courrier.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
