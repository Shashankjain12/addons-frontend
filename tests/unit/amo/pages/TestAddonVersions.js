import * as React from 'react';

import AddonSummaryCard from 'amo/components/AddonSummaryCard';
import AddonVersionCard from 'amo/components/AddonVersionCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import AddonVersions, {
  AddonVersionsBase,
  extractId,
} from 'amo/pages/AddonVersions';
import { createApiError } from 'core/api';
import { ErrorHandler } from 'core/errorHandler';
import {
  createInternalAddon,
  fetchAddon,
  loadAddonResults,
} from 'core/reducers/addons';
import {
  createInternalVersion,
  loadVersions,
  fetchVersions,
} from 'core/reducers/versions';
import {
  createFakeHistory,
  createFakeLocation,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  fakeVersion,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import CardList from 'ui/components/CardList';
import LoadingText from 'ui/components/LoadingText';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const getProps = ({
    location = createFakeLocation(),
    params,
    ...customProps
  } = {}) => {
    return {
      dispatch: sinon.stub(),
      history: createFakeHistory(),
      i18n: fakeI18n(),
      location,
      match: {
        params: {
          slug: fakeAddon.slug,
          ...params,
        },
      },
      store,
      ...customProps,
    };
  };

  const render = ({ ...customProps } = {}) => {
    const props = getProps(customProps);

    return shallowUntilTarget(<AddonVersions {...props} />, AddonVersionsBase);
  };

  const _loadAddonResults = (addons = [fakeAddon]) => {
    store.dispatch(loadAddonResults({ addons }));
  };

  const _loadVersions = ({
    slug = fakeAddon.slug,
    versions = [fakeVersion],
  }) => {
    store.dispatch(loadVersions({ slug, versions }));
  };

  it('does not fetch anything if there is an error', () => {
    const slug = 'some-addon-slug';
    const dispatch = sinon.stub(store, 'dispatch');
    const errorHandler = createStubErrorHandler(new Error('some error'));

    render({
      errorHandler,
      params: { slug },
    });

    sinon.assert.notCalled(dispatch);
  });

  it('fetches an addon when requested by slug', () => {
    const slug = 'some-addon-slug';
    const dispatch = sinon.stub(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    render({ errorHandler, params: { slug } });

    sinon.assert.calledWith(
      dispatch,
      fetchAddon({
        errorHandler,
        slug,
      }),
    );
  });

  it('does not fetch an addon if one is already loaded', () => {
    const slug = 'some-addon-slug';
    const addon = { ...fakeAddon, slug };
    const errorHandler = createStubErrorHandler();

    _loadAddonResults([addon]);

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      params: { slug },
    });

    sinon.assert.neverCalledWith(
      fakeDispatch,
      fetchAddon({
        errorHandler,
        slug,
      }),
    );
  });

  it('does not fetch an addon if one is already loading', () => {
    const slug = 'some-addon-slug';
    const errorHandler = createStubErrorHandler();

    store.dispatch(fetchAddon({ errorHandler, slug }));

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      params: { slug },
    });

    sinon.assert.neverCalledWith(
      fakeDispatch,
      fetchAddon({
        errorHandler,
        slug,
      }),
    );
  });

  it('fetches an addon when the slug changes', () => {
    const slug = 'some-slug';
    const newSlug = 'some-other-slug';
    const addon = { ...fakeAddon, slug };
    const errorHandler = createStubErrorHandler();

    _loadAddonResults([addon]);

    const dispatch = sinon.stub(store, 'dispatch');

    const root = render({
      errorHandler,
      params: { slug },
    });

    dispatch.resetHistory();

    root.setProps({ match: { params: { slug: newSlug } } });

    sinon.assert.calledWith(
      dispatch,
      fetchAddon({
        errorHandler,
        slug: newSlug,
      }),
    );
  });

  it('fetches versions when versions are not loaded', () => {
    const slug = 'some-addon-slug';
    const errorHandler = createStubErrorHandler();

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      params: { slug },
    });

    sinon.assert.calledWith(
      fakeDispatch,
      fetchVersions({
        errorHandlerId: errorHandler.id,
        slug,
      }),
    );
  });

  it('does not fetch versions if they are already loading', () => {
    const slug = 'some-addon-slug';
    const addon = { ...fakeAddon, slug };
    const errorHandler = createStubErrorHandler();

    _loadAddonResults([addon]);
    store.dispatch(fetchVersions({ errorHandlerId: errorHandler.id, slug }));

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      params: { slug },
    });

    sinon.assert.neverCalledWith(
      fakeDispatch,
      fetchVersions({
        errorHandlerId: errorHandler.id,
        slug,
      }),
    );
  });

  it('does not fetch versions if they are already loaded', () => {
    const slug = 'some-addon-slug';
    const addon = { ...fakeAddon, slug };
    const errorHandler = createStubErrorHandler();

    _loadAddonResults([addon]);
    _loadVersions({ slug });

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      params: { slug },
    });

    sinon.assert.neverCalledWith(
      fakeDispatch,
      fetchVersions({
        errorHandlerId: errorHandler.id,
        slug,
      }),
    );
  });

  it('fetches versions when the slug changes', () => {
    const slug = 'some-slug';
    const newSlug = 'some-other-slug';
    const addon = { ...fakeAddon, slug };
    const errorHandler = createStubErrorHandler();

    _loadAddonResults([addon]);

    const dispatch = sinon.stub(store, 'dispatch');

    const root = render({
      errorHandler,
      params: { slug },
    });

    dispatch.resetHistory();

    root.setProps({ match: { params: { slug: newSlug } } });

    sinon.assert.calledWith(
      dispatch,
      fetchVersions({
        errorHandlerId: errorHandler.id,
        slug: newSlug,
      }),
    );
  });

  it('generates an empty header when no add-on is loaded', () => {
    const root = render();

    expect(root.find(AddonSummaryCard)).toHaveProp('headerText', '');
  });

  it('generates an empty header when no versions have loaded', () => {
    const slug = 'some-slug';
    const addon = { ...fakeAddon, slug };

    _loadAddonResults([addon]);

    const root = render({
      params: { slug },
    });

    expect(root.find('title')).toHaveText('');
    expect(root.find(AddonSummaryCard)).toHaveProp('headerText', '');
  });

  it('generates a header with add-on name and version count when versions have loaded', () => {
    const slug = 'some-addon-slug';
    const addon = { ...fakeAddon, slug };
    const versions = [fakeVersion];
    const expectedHeader = `${addon.name} Version history - ${
      versions.length
    } version`;

    _loadAddonResults([addon]);
    _loadVersions({ slug, versions });

    const root = render({
      params: { slug },
    });

    expect(root.find('title')).toHaveText(expectedHeader);
    expect(root.find(AddonSummaryCard)).toHaveProp(
      'headerText',
      expectedHeader,
    );
  });

  it('generates a header for multiple versions', () => {
    const slug = 'some-addon-slug';
    const addon = { ...fakeAddon, slug };
    const versions = [fakeVersion, fakeVersion];
    const expectedHeader = `${addon.name} Version history - ${
      versions.length
    } versions`;

    _loadAddonResults([addon]);
    _loadVersions({ slug, versions });

    const root = render({
      params: { slug },
    });

    expect(root.find('title')).toHaveText(expectedHeader);
  });

  it('passes an add-on to the AddonSummaryCard', () => {
    const slug = 'some-addon-slug';
    const addon = { ...fakeAddon, slug };

    _loadAddonResults([addon]);

    const root = render({
      params: { slug },
    });

    expect(root.find(AddonSummaryCard)).toHaveProp(
      'addon',
      createInternalAddon(addon),
    );
  });

  it('passes a LoadingText component to the CardList header if the header is blank', () => {
    const root = render();

    expect(root.find(CardList)).toHaveProp('header', <LoadingText />);
  });

  it.each([401, 403, 404])(
    'renders a NotFound component when a %d API error has been captured',
    (status) => {
      const error = createApiError({
        response: { status },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'Not Found.' },
      });

      const errorHandler = new ErrorHandler({
        id: 'error-handler-id',
        dispatch: store.dispatch,
      });
      errorHandler.handle(error);

      const root = render({ errorHandler });

      expect(root.find(NotFound)).toHaveLength(1);
    },
  );

  describe('latest version', () => {
    it('passes the first found version into the AddonVersionCard', () => {
      const slug = 'some-addon-slug';
      const version1 = { ...fakeVersion, id: 1 };
      const addon = { ...fakeAddon, slug, current_version: version1 };
      const version2 = { ...fakeVersion, id: 2 };

      _loadAddonResults([addon]);
      _loadVersions({ slug, versions: [version1, version2] });

      const root = render({
        params: { slug },
      });

      const latestVersionCard = root.find(AddonVersionCard).at(0);
      expect(latestVersionCard).toHaveProp('addon', createInternalAddon(addon));
      expect(latestVersionCard).toHaveProp(
        'version',
        createInternalVersion(version1),
      );

      expect(root.find(NotFound)).toHaveLength(0);
    });

    it('passes undefined for the version when versions have not been loaded', () => {
      const root = render();

      expect(root.find(AddonVersionCard)).toHaveProp('version', undefined);
    });

    it('passes null for the version when versions have been loaded, but there are no versions', () => {
      const slug = 'some-addon-slug';
      const addon = { ...fakeAddon, slug };

      _loadAddonResults([addon]);
      _loadVersions({ slug, versions: [] });

      const root = render({
        params: { slug },
      });

      expect(root.find(AddonVersionCard)).toHaveProp('version', null);
    });
  });

  describe('older versions', () => {
    it('renders multiple AddonVersionCards for multiple versions', () => {
      const slug = 'some-addon-slug';
      const version1 = { ...fakeVersion, id: 1 };
      const addon = { ...fakeAddon, slug, current_version: version1 };
      const version2 = { ...fakeVersion, id: 2 };
      const version3 = { ...fakeVersion, id: 3 };

      _loadAddonResults([addon]);
      _loadVersions({ slug, versions: [version1, version2, version3] });

      const root = render({
        params: { slug },
      });

      const versionCards = root.find(AddonVersionCard);
      expect(versionCards).toHaveLength(3);

      expect(root.find(NotFound)).toHaveLength(0);
    });

    it('passes the correct versions into multiple AddonVersionCards', () => {
      const slug = 'some-addon-slug';
      const version1 = { ...fakeVersion, id: 1 };
      const addon = { ...fakeAddon, slug, current_version: version1 };
      const version2 = { ...fakeVersion, id: 2 };
      const version3 = { ...fakeVersion, id: 3 };

      _loadAddonResults([addon]);
      _loadVersions({ slug, versions: [version1, version2, version3] });

      const root = render({
        params: { slug },
      });

      const versionCards = root.find(AddonVersionCard);
      expect(versionCards.at(0)).toHaveProp(
        'version',
        createInternalVersion(version1),
      );
      expect(versionCards.at(1)).toHaveProp(
        'version',
        createInternalVersion(version2),
      );
      expect(versionCards.at(2)).toHaveProp(
        'version',
        createInternalVersion(version3),
      );
    });

    it('passes a header for just the first older version', () => {
      const slug = 'some-addon-slug';
      const addon = { ...fakeAddon, slug };
      const version1 = { ...fakeVersion, id: 1 };
      const version2 = { ...fakeVersion, id: 2 };
      const version3 = { ...fakeVersion, id: 3 };

      _loadAddonResults([addon]);
      _loadVersions({ slug, versions: [version1, version2, version3] });

      const root = render({
        params: { slug },
      });

      const versionCards = root.find(AddonVersionCard);
      expect(versionCards.at(1)).toHaveProp('headerText', 'Older versions');
      expect(versionCards.at(2)).toHaveProp('headerText', null);
    });
  });

  describe('extractId', () => {
    it('returns a unique ID provided by the slug prop and page query param', () => {
      const page = 19;
      const slug = 'some-addon-slug';
      expect(
        extractId(
          getProps({
            location: createFakeLocation({ query: { page } }),
            params: { slug },
          }),
        ),
      ).toEqual(`${slug}-${page}`);
    });

    it('returns a unique ID provided by just the slug if there is no page query param', () => {
      const slug = 'some-addon-slug';
      expect(
        extractId(
          getProps({
            params: { slug },
          }),
        ),
      ).toEqual(`${slug}-`);
    });
  });
});
