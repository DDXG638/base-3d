import CesiumViewer from './components/CesiumViewer';
import ControlPanel from './components/ControlPanel';
import BuildingInfoPanel from './components/BuildingInfoPanel';
import TokenPrompt from './components/TokenPrompt';

export default function App() {
  return (
    <div className="relative w-full h-full bg-black">
      <CesiumViewer />
      <ControlPanel />
      <BuildingInfoPanel />
      <TokenPrompt />
    </div>
  );
}
