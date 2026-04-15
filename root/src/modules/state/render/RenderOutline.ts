import IRenderOutline from "../../interfaces/state/render/IRenderOutline";
import IRenderOutlineChart from "../../interfaces/state/render/IRenderOutlineChart";
import IRenderOutlineNode from "../../interfaces/state/render/IRenderOutlineNode";
import RenderOutlineNode from "./RenderOutlineNode";


export default class RenderOutline implements IRenderOutline {

    constructor(
        path: string,
        baseURI: string
    ) {
        this.path = path;
        this.baseURI = baseURI;
    }

    public path: string;
    public baseURI: string;
    public loaded = false;

    public v: string = '';
    public r: IRenderOutlineNode = new RenderOutlineNode();
    public c: Array<IRenderOutlineChart> = [];
    public e: number | undefined;
    public mv: any | undefined;
}
