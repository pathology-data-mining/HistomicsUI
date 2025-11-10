import $ from 'jquery';

import {restRequest} from '@girder/core/rest';

import events from '../../events';
import router from '../../router';
import View from '../View';

import headerImageTemplate from '../../templates/layout/headerImage.pug';
import '../../stylesheets/layout/headerImage.styl';

var HeaderImageView = View.extend({
    events: {
        'click .h-open-image': function (evt) {
            events.trigger('h:openImageUi');
        },
        'click .h-open-annotated-image': function (evt) {
            events.trigger('h:openAnnotatedImageUi');
        }
    },

    initialize() {
        this.imageModel = null;
        this.parentChain = null;
        this.listenTo(events, 'h:analysis:rendered', this.render);
        this.listenTo(events, 'h:imageOpened', (model) => {
            this.imageModel = model;
            this.parentChain = null;
            this._setNextPreviousImage();
            if (model) {
                this.imageModel.getRootPath((resp) => {
                    this.parentChain = resp;
                    this.render();
                });
            }
            this.render();
        });
    },

    render() {
        const analysis = router.getQuery('analysis') ? `&analysis=${router.getQuery('analysis')}` : '';
        const folder = router.getQuery('folder') ? `&folder=${router.getQuery('folder')}` : '';
        const nextImageLink = this._nextImage ? `#?image=${this._nextImage}${folder}${analysis}` : null;
        const previousImageLink = this._previousImage ? `#?image=${this._previousImage}${folder}${analysis}` : null;
        this.$el.html(headerImageTemplate({
            image: this.imageModel,
            parentChain: this.parentChain,
            previousImageLink,
            previousImageName: this._previousName,
            nextImageLink,
            nextImageName: this._nextName,
            currentIndex: this._currentIndex,
            totalCount: this._totalCount
        }));
        return this;
    },

    _setNextPreviousImage() {
        const model = this.imageModel;
        const folder = router.getQuery('folder') ? `?folderId=${router.getQuery('folder')}` : '';
        if (!model) {
            this._nextImage = null;
            this._previousImage = null;
            this._currentIndex = null;
            this._totalCount = null;
            this.render();
            return;
        }

        restRequest({
            url: `item/${model.id}/adjacent_images${folder}`
        }).done((result) => {
            this._previousImage = (result.previous._id !== model.id) ? result.previous._id : null;
            this._previousName = result.previous.name;
            this._nextImage = (result.next._id !== model.id) ? result.next._id : null;
            this._nextName = result.next.name;
            this._currentIndex = result.index + 1; // Convert 0-based to 1-based
            this._totalCount = result.count;
            this.render();
        });
    }
});

export default HeaderImageView;
