import IState from "../../interfaces/state/IState";
import IRenderFragment from "../../interfaces/state/render/IRenderFragment";
import IRenderGuide from "../../interfaces/state/render/IRenderGuide";
import IRenderOutlineChart from "../../interfaces/state/render/IRenderOutlineChart";
import Filters from "../../state/constants/Filters";
import DisplayGuide from "../../state/display/DisplayGuide";
import RenderGuide from "../../state/render/RenderGuide";
import TreeSolve from "../../state/window/TreeSolve";
import gFileConstants from "../gFileConstants";
import gFragmentCode from "./gFragmentCode";
import gStateCode from "./gStateCode";


const parseGuide = (rawGuide: any): IRenderGuide => {

    const guide: IRenderGuide = new RenderGuide(rawGuide.id);
    guide.title = rawGuide.title ?? '';
    guide.description = rawGuide.description ?? '';
    guide.path = rawGuide.path ?? null;
    guide.fragmentFolderUrl = gRenderCode.getGuideFragmentFolderUrl(rawGuide.fragmentFolderPath);

    return guide;
};

const parseRender8Comment = (
    state: IState,
    raw: any
): void => {

    if (!raw) {
        return raw;
    }

    /*
{
    "guide": {
        "id": "dBt7JN1vt"
    },
    "fragment": {
        "id": "dBt7JN1vt",
        "topLevelMapKey": "cv1TRl01rf",
        "mapKeyChain": "cv1TRl01rf",
        "guideID": "dBt7JN1He",
        "parentFragmentID": null,
        "chartKey": "cv1TRl01rf",
        "options": [
            {
                "id": "dBt7KZ1AN",
                "option": "Option 1",
                "isAncillary": false,
                "order": 1
            },
            {
                "id": "dBt7KZ1Rb",
                "option": "Option 2",
                "isAncillary": false,
                "order": 2
            },
            {
                "id": "dBt7KZ24B",
                "option": "Option 3",
                "isAncillary": false,
                "order": 3
            }
        ]
    }
}    
    */

    const guide = parseGuide(raw.guide);

    const displayGuide = new DisplayGuide(
        gStateCode.getFreshKeyInt(state),
        guide,
        raw.fragment.id
    );

    gFragmentCode.parseAndLoadGuideRootFragment(
        state,
        raw.fragment,
        displayGuide.root
    );

    state.renderState.displayGuide = displayGuide;
    state.renderState.currentSection = displayGuide;

    gFragmentCode.cacheSectionRoot(
        state,
        state.renderState.displayGuide
    );
};

const gRenderCode = {

    getGuideFragmentFolderUrl: (folderPath: string): string => {

        const url = new URL(
            folderPath,
            document.baseURI
        );

        return url.toString();
    },

    getFragmentFolderUrl: (
        chart: IRenderOutlineChart,
        fragment: IRenderFragment
    ): string => {

        const path = chart.p;

        if (path.startsWith('https://') === true
            || path.startsWith('http://') === true
        ) {
            return path;
        }

        let baseURI = fragment.section.outline?.baseURI;

        if (!baseURI) {

            baseURI = document.baseURI;
        }

        const url = new URL(
            path,
            baseURI
        );

        return url.toString();
    },

    registerGuideComment: () => {

        const treeSolveGuide: HTMLDivElement = document.getElementById(Filters.treeSolveGuideID) as HTMLDivElement;

        if (treeSolveGuide
            && treeSolveGuide.hasChildNodes() === true
        ) {
            let childNode: ChildNode;

            for (let i = 0; i < treeSolveGuide.childNodes.length; i++) {

                childNode = treeSolveGuide.childNodes[i];

                if (childNode.nodeType === Node.COMMENT_NODE) {

                    if (!window.TreeSolve) {

                        window.TreeSolve = new TreeSolve();
                    }

                    window.TreeSolve.renderingComment = childNode.textContent;
                    childNode.remove();

                    break;
                }
                else if (childNode.nodeType !== Node.TEXT_NODE) {
                    break;
                }
            }
        }
    },

    parseRender8Comment: (state: IState) => {

        if (!window.TreeSolve?.renderingComment) {
            return;
        }

        try {
            let guideRenderComment = window.TreeSolve.renderingComment;
            guideRenderComment = guideRenderComment.trim();

            if (!guideRenderComment.startsWith(gFileConstants.guideRenderCommentTag)) {
                return;
            }

            guideRenderComment = guideRenderComment.substring(gFileConstants.guideRenderCommentTag.length);
            const raw = JSON.parse(guideRenderComment);

            parseRender8Comment(
                state,
                raw
            );
        }
        catch (e) {
            console.error(e);

            return;
        }
    }
}

export default gRenderCode;
