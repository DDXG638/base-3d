import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import { useShaderStore } from './store';

export default function PostEffects() {
  const bloomIntensity = useShaderStore((s) => s.bloomIntensity);
  const bloomThreshold = useShaderStore((s) => s.bloomThreshold);

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ToneMapping />
    </EffectComposer>
  );
}
