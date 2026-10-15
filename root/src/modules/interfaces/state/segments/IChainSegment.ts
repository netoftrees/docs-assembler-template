import IDisplaySection from "../display/IDisplaySection";
import IRenderOutlineNode from "../render/IRenderOutlineNode";
import ISegmentNode from "./ISegmentNode";


export default interface IChainSegment {

    index: number;
    outlineNodes: Array<IRenderOutlineNode>;
    outlineNodesLoaded: boolean;
    inlineEnded: boolean;

    start: ISegmentNode;
    end: ISegmentNode;

    // Which map (link) to search when looking for this segment's parent node
    // This should match the previous segment's segmentSection
    segmentInSection: IDisplaySection | null;
    // Which map (link) to search when looking for this segment's nodes
    // This should match the previous segment's segmentOutSection
    segmentSection: IDisplaySection | null;
    // Which map (link) to search when looking for the first node in the next segment
    // This should match the next segment's segmentSection
    segmentOutSection: IDisplaySection | null;
}

