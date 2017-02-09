import { BuilderScreenPropertiesBase } from './builder-screen-properties-base';
import { extend } from '../../../util';

export class BuilderScreenNumericPropertiesBase extends BuilderScreenPropertiesBase {
  get config() {
    return {
      helpers: extend(super.config.helpers, {
        toggleNonNumericProperties: () => this.app.updateBuilderCurrentScreen({
          showingNonNumericProperties: !this.isShowingNonNumericProperties(),
        }),
      }),
    };
  }

  isShowingNonNumericProperties() {
    const screen = this.app.getBuilderCurrentScreen();
    return screen && !!screen.showingNonNumericProperties;
  }

  filterNonNumericProperties(properties) {
    if (this.isShowingNonNumericProperties()) {
      return properties;
    } else {
      return properties.filter(prop => prop.type === `number`);
    }
  }
}
