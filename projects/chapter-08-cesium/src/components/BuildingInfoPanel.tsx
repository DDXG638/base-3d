import { useStore, type BuildingInfo } from '../store';

const statusLabels: Record<BuildingInfo['status'], { text: string; color: string }> = {
  normal: { text: '正常', color: 'bg-green-500' },
  alert: { text: '告警', color: 'bg-red-500' },
  offline: { text: '离线', color: 'bg-gray-500' },
};

export default function BuildingInfoPanel() {
  const building = useStore((s) => s.selectedBuilding);
  const selectBuilding = useStore((s) => s.selectBuilding);

  if (!building) return null;

  const status = statusLabels[building.status];

  return (
    <div className="absolute top-4 right-4 w-64 bg-gray-900/90 backdrop-blur rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div>
          <div className="text-teal-400 text-sm font-semibold">{building.name}</div>
          <div className="text-gray-500 text-[10px] mt-0.5">
            {building.lng.toFixed(4)}, {building.lat.toFixed(4)}
          </div>
        </div>
        <button
          onClick={() => selectBuilding(null)}
          className="text-gray-500 hover:text-gray-300 text-xs px-1.5 py-0.5 rounded hover:bg-gray-800"
        >
          ✕
        </button>
      </div>

      {/* 属性信息 */}
      <div className="p-3 space-y-2">
        <Row label="高度" value={`${building.height}m`} />
        <Row label="楼层" value={`${building.floors}层`} />
        <Row label="面积" value={`${(building.area / 10000).toFixed(1)}万m²`} />
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">状态</span>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
            <span className={building.status === 'alert' ? 'text-red-400' : 'text-gray-300'}>
              {status.text}
            </span>
          </span>
        </div>
      </div>

      {/* 提示 */}
      <div className="px-3 pb-3 text-[10px] text-gray-600">
        点击 3D 场景中的其他建筑可切换选中
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200">{value}</span>
    </div>
  );
}
