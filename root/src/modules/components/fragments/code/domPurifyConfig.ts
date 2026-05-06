import DOMPurify from 'dompurify';


const domPurifyConfig = {

    ALLOWED_TAGS: [

        // All content sectioning (safe)
        'address', 'article', 'aside', 'footer', 'header',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hgroup', 'main', 'nav', 'section', 'search',

        // All text content (safe)
        'blockquote', 'dd', 'div', 'dl', 'dt', 'figcaption', 'figure',
        'hr', 'li', 'menu', 'ol', 'p', 'pre', 'ul',

        // All inline semantics (safe)
        'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn',
        'em', 'i', 'kbd', 'mark', 'q', 'rp', 'rt', 'ruby', 's', 'samp',
        'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr',

        // Tables (safe)
        'caption', 'col', 'colgroup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr',

        // Media — img is safe IF you sanitize src
        'img',

        // Links
        'a',

        // Video step needs these
        'iframe',

        // Optional: details/summary for collapsible docs
        'details', 'summary'
    ],

    ALLOWED_ATTR: [

        // Global
        'class', 'id', 'style', 'title', 'dir', 'lang', 'role', 
        
        // Aria
        'aria-label', 'aria-hidden', 'aria-expanded', 'aria-controls',
        'aria-describedby', 'aria-labelledby',

        // Links — HREF is the danger point
        'href', 'target', 'rel',

        // Images
        'src', 'alt', 'width', 'height', 'loading',

        // Iframes
        'src', 'frameborder', 'allow', 'allowfullscreen', 'loading',

        // Docs Assembler
        'data-vimeo-url', 'data-discussion', 
        // 'data-*'

        // Common data
        'data-align', 'data-caption'  
    ],

    // Prevent javascript: URLs
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|xxx):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,

    // Block data URIs
    SANITIZE_DOM: true
};

// Hook to force rel="noopener noreferrer" on external links
DOMPurify.addHook(
    'afterSanitizeAttributes',

    function (node: any) {

    if (node.tagName === 'A' 
        && node.getAttribute('target') === '_blank'
    ) {
        const rel = (node.getAttribute('rel') || '').split(' ');

        if (!rel.includes('noopener')) {

            rel.push('noopener');
        }

        if (!rel.includes('noreferrer')) {
            
            rel.push('noreferrer');
        }

        node.setAttribute(
            'rel', 
            rel.join(' ').trim()
        );
    }
    
    // Strip inline event handlers if any slipped through
    const attrs = node.attributes;

    for (let i = attrs.length - 1; i >= 0; i--) {

        const name = attrs[i].name;

        if (name.startsWith('on')) {
            
            node.removeAttribute(name);
        }
    }
});

export default domPurifyConfig;
