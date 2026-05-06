import DOMPurify from 'dompurify';

import Filters from "../../../state/constants/Filters";
import domPurifyConfig from './domPurifyConfig';


const onFragmentsRenderFinished = () => {

    const fragmentBoxDiscussions: NodeListOf<Element> = document.querySelectorAll(Filters.fragmentBoxDiscussion);
    let fragmentBox: HTMLDivElement;
    let dataDiscussion: string | undefined;

    for (let i = 0; i < fragmentBoxDiscussions.length; i++) {

        fragmentBox = fragmentBoxDiscussions[i] as HTMLDivElement;
        dataDiscussion = fragmentBox.dataset.discussion;

        if (dataDiscussion != null) {

            fragmentBox.innerHTML = DOMPurify.sanitize(
                dataDiscussion, 
                domPurifyConfig
            );
            
            delete fragmentBox.dataset.discussion;
        }
    }
};

export default onFragmentsRenderFinished;
