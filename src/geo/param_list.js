import { HoleQuad } from './hole_quad';
import { DialPanel } from './dial_panel';
import { HandlePanel } from './handle_panel';
import { ButtonPanel } from './button_panel';
import { BevelPanel } from './bevel_panel';

export const FeatureList = [
    {
        class: BevelPanel,
        name: 'extrude',
        desc: 'Extrude a panel either in or out with beveled edges'
    },
    {
        class: ButtonPanel,
        name: 'buttons',
        desc: 'Fill an area with buttons, or set the extrude to a negative value for holes'
    },
    {
        class: HandlePanel,
        name: 'handle',
        desc: 'Add handles at the left and right of the region'
    },
    {
        class: DialPanel,
        name: 'dial',
        desc: 'Add a single meter dial'
    }
];

