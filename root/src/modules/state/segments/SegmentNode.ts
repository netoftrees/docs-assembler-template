import { OutlineType } from "../../interfaces/enums/OutlineType";
import ISegmentNode from "../../interfaces/state/segments/ISegmentNode";


export default class SegmentNode implements ISegmentNode {

    constructor(
        text: string,
        key: string,
        type: OutlineType,
        isRoot: boolean,
        isLast: boolean,
        segmentIndex: number,
        isSilent: boolean = false
    ) {
        this.text = text;
        this.key = key;
        this.type = type;
        this.isRoot = isRoot;
        this.isLast = isLast;
        this.segmentIndex = segmentIndex;
        this.isSilent = isSilent;
    }

    public text: string;
    public key: string;
    public type: OutlineType;
    public isRoot: boolean;
    public isLast: boolean;
    public isSilent: boolean;
    public segmentIndex: number;
}

