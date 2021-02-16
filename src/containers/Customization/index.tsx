import classnames from 'classnames';
import * as React from 'react';
import { injectIntl } from 'react-intl';
import { connect, MapDispatchToPropsFunction } from 'react-redux';
import { RouterProps } from 'react-router';
import { withRouter } from 'react-router-dom';
import { IntlProps } from '../../';
import { PaletteIcon } from '../../assets/images/customization/PaletteIcon';
import {
    CustomizationFonts,
    CustomizationImages,
    CustomizationSpacing,
    CustomizationThemes,
    TabPanel,
} from '../../components';
import {
    changeColorTheme,
    CustomizationCurrentDataInterface,
    CustomizationDataInterface,
    customizationUpdate,
    customizationUpdateCurrent,
    RootState,
    selectCurrentColorTheme,
    selectCustomizationCurrent,
    selectCustomizationData,
    selectUserLoggedIn,
    ThemeColorInterface,
    toggleChartRebuild,
} from '../../modules';
import { AVAILABLE_COLORS_TITLES } from '../../themes';

import './customization.pcss';

interface ReduxProps {
    colorTheme: string;
    currentCustomization?: CustomizationCurrentDataInterface;
    customization?: CustomizationDataInterface;
    userLoggedIn: boolean;
}

interface DispatchProps {
    changeColorTheme: typeof changeColorTheme;
    customizationUpdate: typeof customizationUpdate;
    customizationUpdateCurrent: typeof customizationUpdateCurrent;
    toggleChartRebuild: typeof toggleChartRebuild;
}

type Props = ReduxProps & RouterProps & DispatchProps & IntlProps;

interface State {
    currentTabIndex: number;
    isOpen: boolean;
    resetToDefault: boolean;
}

class CustomizationContainer extends React.Component<Props, State> {
    public state = {
        currentTabIndex: 0,
        isOpen: true,
        resetToDefault: false,
    };

    public renderTabs = () => {
        const {
            colorTheme,
            currentCustomization,
            customization,
            changeColorTheme,
        } = this.props;
        const { currentTabIndex, resetToDefault } = this.state;

        return [
            {
                content: currentTabIndex === 0 ? (
                    <CustomizationThemes
                        colorTheme={colorTheme}
                        currentCustomization={currentCustomization}
                        customization={customization}
                        resetToDefault={resetToDefault}
                        handleSetCurrentColorTheme={changeColorTheme}
                        handleSetCurrentCustomization={this.handleSetCurrentCustomization}
                        handleTriggerChartRebuild={this.handleTriggerChartRebuild}
                        translate={this.translate}
                    />
                ) : null,
                label: this.translate('page.body.customization.tabs.themes'),
            },
            {
                content: currentTabIndex === 1 ? <CustomizationFonts translate={this.translate} /> : null,
                label: this.translate('page.body.customization.tabs.fonts'),
            },
            {
                content: currentTabIndex === 2 ? <CustomizationSpacing translate={this.translate} /> : null,
                label: this.translate('page.body.customization.tabs.spacing'),
            },
            {
                content: currentTabIndex === 3 ? <CustomizationImages translate={this.translate} /> : null,
                label: this.translate('page.body.customization.tabs.images'),
            },
        ];
    };

    public renderActionButtons() {
        return (
            <div className="pg-customization__action-buttons">
                <span className="pg-customization__action-buttons__button" onClick={this.handleClickResetButton}>
                    {this.translate('page.body.customization.actionButtons.reset')}
                </span>
                <span className="pg-customization__action-buttons__button" onClick={this.handleClickSaveButton}>
                    {this.translate('page.body.customization.actionButtons.save')}
                </span>
            </div>
        );
    }

    public render() {
        const { userLoggedIn } = this.props;
        const { currentTabIndex, isOpen } = this.state;

        if (!userLoggedIn || !this.handleCheckRoute()) {
            return null;
        }

        const customizationClassName = classnames('pg-customization', {
            'pg-customization--hidden': !isOpen,
        });

        return (
            <div className={customizationClassName}>
                <div className="pg-customization__toggler" onClick={e => this.handleToggleIsOpen()}>
                    <PaletteIcon />
                </div>
                <TabPanel
                    panels={this.renderTabs()}
                    onTabChange={this.handleChangeTab}
                    currentTabIndex={currentTabIndex}
                />
                {this.renderActionButtons()}
            </div>
        );
    }

    private handleClickResetButton = () => {
        this.setState(prevState => ({
            resetToDefault: !prevState.resetToDefault,
        }));
    };

    private handleClickSaveButton = () => {
        const { colorTheme, currentCustomization } = this.props;
        const bodyStyles = window.getComputedStyle(document.body);
        const currentColors: ThemeColorInterface[] = [];

        if (bodyStyles) {
            AVAILABLE_COLORS_TITLES.reduce((result, item) => {
               const itemColor = bodyStyles.getPropertyValue(item.key);

               if (itemColor) {
                    currentColors.push({
                        key: item.key,
                        value: itemColor,
                    });
                }

               return result;
            }, {});
        }

        const payload: CustomizationCurrentDataInterface = {
            ...currentCustomization,
            theme_colors: {
                ...currentCustomization?.theme_colors,
                [colorTheme]: [...currentColors],
            },
        };

        this.props.customizationUpdate({ settings: JSON.stringify(payload) });
    };


    private handleChangeTab = (index: number) => {
        this.setState({
            currentTabIndex: index,
        });
    };

    private handleCheckRoute = () => {
        if (window.location.hash && window.location.hash.substring(1) === 'settings') {
            return true;
        }

        return false;
    };

    private handleSetCurrentCustomization = (key: string, value: string | number) => {
        const { currentCustomization } = this.props;
        const updatedCustomization = {
            ...currentCustomization,
            [key]: value,
        };

        // @ts-ignore
        this.props.customizationUpdateCurrent(updatedCustomization);
    };

    private handleToggleIsOpen = () => {
        this.setState(prevState => ({
            isOpen: !prevState.isOpen,
        }));
    };

    private handleTriggerChartRebuild = () => {
        this.props.toggleChartRebuild();
    };

    private translate = (key: string) => this.props.intl.formatMessage({id: key});
}

const mapStateToProps = (state: RootState): ReduxProps => ({
    colorTheme: selectCurrentColorTheme(state),
    currentCustomization: selectCustomizationCurrent(state),
    customization: selectCustomizationData(state),
    userLoggedIn: selectUserLoggedIn(state),
});

const mapDispatchProps: MapDispatchToPropsFunction<DispatchProps, {}> =
    dispatch => ({
        changeColorTheme: payload => dispatch(changeColorTheme(payload)),
        customizationUpdate: payload => dispatch(customizationUpdate(payload)),
        customizationUpdateCurrent: payload => dispatch(customizationUpdateCurrent(payload)),
        toggleChartRebuild: () => dispatch(toggleChartRebuild()),
    });

// tslint:disable no-any
export const Customization = injectIntl(withRouter(connect(mapStateToProps, mapDispatchProps)(CustomizationContainer) as any) as any);
