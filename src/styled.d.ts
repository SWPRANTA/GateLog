import 'styled-components/native';
import { Theme } from './constants/theme';

declare module 'styled-components/native' {
    export interface DefaultTheme extends Theme { }
}
