import IRenderOutlineChart from "./IRenderOutlineChart";
import IRenderOutlineNode from "./IRenderOutlineNode";


export default interface IRenderOutline {

    path: string;
    baseURI: string;
    loaded: boolean;
    
    v: string; // version
    r: IRenderOutlineNode; // root fragment
    c: Array<IRenderOutlineChart>; // referenced charts
    e: number | undefined // exit count
    mv: any | undefined
}

