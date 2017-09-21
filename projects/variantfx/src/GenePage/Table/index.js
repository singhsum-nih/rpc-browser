/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable space-before-function-paren */
/* eslint-disable no-shadow */
/* eslint-disable comma-dangle */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */

import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import VariantTable from '@broad/table'

import { actions as activeActions } from '@broad/gene-page/src/resources/active'

import {
  tablePosition,
  searchText,
  searchFilteredVariants,
  actions as tableActions
} from '@broad/gene-page/src/resources/table'

import { tableConfig } from './tableConfig'

const GnomadVariantTable = ({
  variants,
  setVariantSort,
  setCurrentVariant,
  setCurrentTableIndex,
  tablePosition,
  searchText,
}) => {
  const tConfig = tableConfig(setVariantSort)

  const scrollBarWidth = 40
  const paddingWidth = tConfig.fields.length * 40
  const cellContentWidth = tConfig.fields.reduce((acc, field) =>
    acc + field.width, 0)
  const calculatedWidth = scrollBarWidth + paddingWidth + cellContentWidth

  return (
    <div style={{ marginLeft: '30px' }}>
      <VariantTable
        title={''}
        height={200}
        width={calculatedWidth}
        tableConfig={tConfig}
        tableData={variants}
        remoteRowCount={variants.size}
        loadMoreRows={() => {}}
        overscan={0}
        loadLookAhead={0}
        onRowClick={setCurrentVariant}
        scrollToRow={tablePosition}
        scrollCallback={setCurrentTableIndex}
        searchText={searchText}
      />
    </div>
  )
}
GnomadVariantTable.propTypes = {
  variants: PropTypes.any.isRequired,
  setVariantSort: PropTypes.func.isRequired,
  setCurrentVariant: PropTypes.func.isRequired,
  setCurrentTableIndex: PropTypes.func.isRequired,
  tablePosition: PropTypes.number.isRequired,
  searchText: PropTypes.string.isRequired,
  // setVisibleInTable: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => {
  return {
    variants: searchFilteredVariants(state),
    tablePosition: tablePosition(state),
    searchText: searchText(state),
    currentNavigatorPosition: state.active.currentNavigatorPosition,
  }
}
const mapDispatchToProps = (dispatch) => {
  return {
    setVariantSort: sortKey => dispatch(tableActions.setVariantSort(sortKey)),
    setCurrentVariant: variantId => dispatch(activeActions.setCurrentVariant(variantId)),
    setCurrentTableIndex: index => dispatch(activeActions.setCurrentTableIndex(index)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(GnomadVariantTable)
