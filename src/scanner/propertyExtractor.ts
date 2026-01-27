import * as fs from 'fs';
import * as path from 'path';

/**
 * 属性提取器 - 从 CommonMethod 提取通用属性
 */
export class PropertyExtractor {
  constructor(private sdkPath: string) {}

  /**
   * 提取所有通用属性
   */
  extractCommonProperties(): string[] {
    const properties: Set<string> = new Set();

    // 从 CommonMethod 类提取属性
    const commonFile = path.join(this.sdkPath, 'component', 'ets', 'common.d.ts');

    if (!fs.existsSync(commonFile)) {
      console.warn(`CommonMethod 文件不存在: ${commonFile}`);
      return this.getKnownProperties();
    }

    try {
      const content = fs.readFileSync(commonFile, 'utf-8');

      // 找到 CommonMethod 类的开始位置
      const startIdx = content.indexOf('declare class CommonMethod');

      if (startIdx === -1) {
        console.warn('未找到 CommonMethod 类定义');
        return this.getKnownProperties();
      }

      // 找到类的结束位置
      let depth = 0;
      let endIdx = startIdx;

      for (let i = startIdx; i < content.length; i++) {
        if (content[i] === '{') {
          depth++;
        } else if (content[i] === '}') {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }

      const classContent = content.substring(startIdx, endIdx);

      // 提取所有方法名： methodName(params...): ReturnType
      // 使用正则匹配方法定义（缩进2个空格，方法名，括号，返回类型）
      const methodPattern = /^\s{2}([a-zA-Z_]\w*)\s*\(/gm;
      const matches = classContent.matchAll(methodPattern);

      for (const match of matches) {
        const methodName = match[1];

        // 排除一些非属性方法
        const skipMethods = [
          'constructor',
          'onChildTouchTest',
          'gesture',
          'parallelGesture',
          'priorityGesture'
        ];

        if (!skipMethods.includes(methodName) && !methodName.startsWith('_')) {
          properties.add(methodName);
        }
      }

      console.log(`从 CommonMethod 提取到 ${properties.size} 个属性`);

    } catch (error) {
      console.error('读取 CommonMethod 文件失败:', error);
    }

    // 如果没有提取到属性，返回已知属性列表
    if (properties.size === 0) {
      return this.getKnownProperties();
    }

    return Array.from(properties).sort();
  }

  /**
   * 获取已知的常用属性列表（作为备选）
   */
  private getKnownProperties(): string[] {
    return [
      // 尺寸相关
      'width', 'height', 'size', 'constraintSize',
      'layoutWeight', 'flexGrow', 'flexShrink', 'flexBasis',
      'aspectRatio', 'displayPriority',

      // 位置相关
      'position', 'offset', 'markAnchor', 'align',
      'alignRules', 'alignSelf', 'margin', 'padding',

      // 背景和前景
      'backgroundColor', 'foregroundColor',
      'background', 'backgroundImage', 'backgroundImageSize',
      'backgroundImagePosition', 'backgroundImageResizable',
      'backgroundBlurStyle', 'backgroundEffect', 'backgroundFilter',
      'foregroundEffect', 'foregroundFilter', 'foregroundBlurStyle',

      // 边框
      'border', 'borderWidth', 'borderColor', 'borderStyle',
      'borderRadius', 'borderImage',
      'outline', 'outlineColor', 'outlineStyle', 'outlineWidth', 'outlineRadius',

      // 透明度和显示
      'opacity', 'visibility', 'display', 'overlay',
      'blur', 'backdropBlur', 'motionBlur', 'linearGradientBlur',

      // 滤镜和效果
      'brightness', 'contrast', 'saturate', 'grayscale', 'invert', 'sepia',
      'hueRotate', 'colorBlend', 'blendMode', 'advancedBlendMode',
      'shadow', 'compositingFilter', 'materialFilter',
      'visualEffect', 'systemBarEffect',

      // 渐变
      'linearGradient', 'radialGradient', 'sweepGradient',

      // 变换
      'transform', 'transform3D', 'rotate', 'scale', 'translate',
      'geometryTransition', 'motionPath',

      // 裁剪
      'clip', 'clipShape', 'mask', 'maskShape',

      // 动画
      'animation', 'transition', 'sharedTransition', 'useEffect',
      'useUnionEffect', 'useShadowBatching', 'freeze',

      // 事件
      'onClick', 'onAppear', 'onDisAppear', 'onAttach', 'onDetach',
      'onTouch', 'onHover', 'onHoverMove', 'onMouse', 'onKeyEvent',
      'onKeyEventDispatch', 'onKeyPreIme', 'onFocus', 'onBlur',
      'onDragStart', 'onDragMove', 'onDragEnd', 'onDragEnter', 'onDragLeave',
      'onDrop', 'onPreDrag', 'onAreaChange', 'onAxisEvent', 'onFocusAxisEvent',
      'onDigitalCrown', 'onAccessibilityHover', 'onAccessibilityHoverTransparent',

      // 焦点
      'focusable', 'defaultFocus', 'nextFocus', 'tabIndex', 'tabStop',
      'focusOnTouch', 'focusBox', 'focusScopeId', 'focusScopePriority',
      'groupDefaultFocus',

      // 拖放
      'draggable', 'allowDrop', 'dragPreview', 'dragPreviewOptions',

      // 滚动
      'scrollable', 'scrollBar', 'scrollBarColor', 'scrollBarWidth',
      'edgeEffect', 'gridOffset', 'gridSpan',

      // 特效
      'renderGroup', 'excludeFromRenderGroup', 'clickEffect', 'hoverEffect',
      'pixelRound', 'pixelRoundEffect',

      // 交互
      'hitTestBehavior', 'responseRegion', 'responseRegionList',
      'mouseResponseRegion', 'touchable', 'enabled',

      // 安全区域
      'expandSafeArea', 'ignoreLayoutSafeArea', 'safeAreaPadding',

      // 布局
      'direction', 'layoutGravity', 'chainMode', 'chainWeight',

      // ID和数据
      'id', 'key', 'tag', 'group',

      // 其他
      'zIndex', 'customProperty', 'drawModifier', 'bindPopup', 'bindTips',
      'enableClickSoundEffect', 'useSizeType', 'toolbar'
    ];
  }
}
