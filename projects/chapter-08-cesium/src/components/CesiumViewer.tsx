import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useStore, buildings } from '../store';

export default function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const setViewerReady = useStore((s) => s.setViewerReady);
  const selectBuilding = useStore((s) => s.selectBuilding);
  const showLabels = useStore((s) => s.showLabels);

  useEffect(() => {
    const token = (window as any).CESIUM_ION_TOKEN;
    if (!token || !containerRef.current) return;

    // 设置 Access Token
    Cesium.Ion.defaultAccessToken = token;

    // 初始化 Viewer
    const viewer = new Cesium.Viewer(containerRef.current, {
      // 使用 Cesium 全球地形
      terrain: Cesium.Terrain.fromWorldTerrain(),
      // 初始底图：Bing Maps（如果 Token 有权限）
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
    });

    viewerRef.current = viewer;

    // 添加 OpenStreetMap 影像（备用底图）
    const osmLayer = viewer.imageryLayers.addImageryProvider(
      new Cesium.OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/',
      }),
    );
    (osmLayer as any)._name = 'OpenStreetMap';

    // 飞到北京国贸区域
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(116.461, 39.909, 1200),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
    });

    // 放置建筑 Entity
    buildings.forEach((b) => {
      // 建筑高度：将 altitude 设在地形上方，避免被地形遮挡
      const altitude = 50; // 北京城区海拔约 40-50m，建筑起步在此以上
      const entity = viewer.entities.add({
        id: b.id,
        position: Cesium.Cartesian3.fromDegrees(b.lng, b.lat, altitude + b.height / 10),
        cylinder: {
          length: b.height / 5,        // 缩小便于展示
          topRadius: 30,
          bottomRadius: 30,
          material: getStatusColor(b.status) as any,
        },
        label: {
          text: b.name,
          font: '12px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          show: showLabels,
          disableDepthTestDistance: Number.POSITIVE_INFINITY, // 标签始终可见
        },
        properties: { buildingInfo: b },
      });
      entitiesRef.current.set(b.id, entity);
    });

    // 点击建筑 Entity → 显示信息
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      // drillPick 返回所有命中对象（穿透透明/地形），比 pick() 只取顶层更可靠
      const pickedList = viewer.scene.drillPick(click.position);
      for (const picked of pickedList) {
        if (Cesium.defined(picked) && picked.id) {
          const entity = picked.id as Cesium.Entity;
          const info = entity.properties?.buildingInfo?.getValue();
          if (info) {
            selectBuilding(info);
            return;
          }
        }
      }
      selectBuilding(null);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    setViewerReady(true);

    return () => {
      handler.destroy();
      viewer.destroy();
      setViewerReady(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 标签显示/隐藏
  useEffect(() => {
    entitiesRef.current.forEach((entity) => {
      if (entity.label) {
        entity.label.show = new Cesium.ConstantProperty(showLabels);
      }
    });
  }, [showLabels]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}

/** 根据状态返回不同颜色 */
function getStatusColor(status: string): Cesium.Color {
  switch (status) {
    case 'alert': return Cesium.Color.RED.withAlpha(0.8);
    case 'offline': return Cesium.Color.GRAY.withAlpha(0.6);
    default: return Cesium.Color.CYAN.withAlpha(0.7);
  }
}
