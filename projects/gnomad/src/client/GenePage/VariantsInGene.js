import throttle from 'lodash.throttle'
import memoizeOne from 'memoize-one'
import PropTypes from 'prop-types'
import React, { Component } from 'react'

import { Cursor, PositionAxisTrack } from '@broad/region-viewer'

import ClinVarTrack from '../clinvar/ClinVarTrack'
import datasetLabels from '../datasetLabels'
import Link from '../Link'
import Query from '../Query'
import StatusMessage from '../StatusMessage'
import { TrackPageSection } from '../TrackPage'
import ExportVariantsButton from '../VariantList/ExportVariantsButton'
import filterVariants from '../VariantList/filterVariants'
import mergeExomeAndGenomeData from '../VariantList/mergeExomeAndGenomeData'
import sortVariants from '../VariantList/sortVariants'
import VariantFilterControls from '../VariantList/VariantFilterControls'
import VariantTable from '../VariantList/VariantTable'
import { getColumns } from '../VariantList/variantTableColumns'
import VariantTrack from '../VariantList/VariantTrack'

class VariantsInGene extends Component {
  static propTypes = {
    clinVarVariants: PropTypes.arrayOf(PropTypes.object).isRequired,
    datasetId: PropTypes.string.isRequired,
    gene: PropTypes.shape({
      chrom: PropTypes.string.isRequired,
      gene_id: PropTypes.string.isRequired,
    }).isRequired,
    variants: PropTypes.arrayOf(PropTypes.object).isRequired,
    width: PropTypes.number.isRequired,
  }

  constructor(props) {
    super(props)

    const defaultFilter = {
      includeCategories: {
        lof: true,
        missense: true,
        synonymous: true,
        other: true,
      },
      includeFilteredVariants: false,
      includeSNVs: true,
      includeIndels: true,
      includeExomes: true,
      includeGenomes: true,
      searchText: '',
    }

    const defaultSortKey = 'variant_id'
    const defaultSortOrder = 'ascending'

    const renderedVariants = sortVariants(
      mergeExomeAndGenomeData(filterVariants(props.variants, defaultFilter)),
      {
        sortKey: defaultSortKey,
        sortOrder: defaultSortOrder,
      }
    )

    this.state = {
      filter: defaultFilter,
      rowIndexLastClickedInNavigator: 0,
      renderedVariants,
      sortKey: defaultSortKey,
      sortOrder: defaultSortOrder,
      variantHoveredInTable: null,
      visibleVariantWindow: [0, 19],
    }
  }

  getColumns = memoizeOne((width, chrom) =>
    getColumns({
      width,
      includeGene: false,
      includeHomozygoteAC: chrom !== 'Y',
      includeHemizygoteAC: chrom === 'X' || chrom === 'Y',
    })
  )

  onFilter = newFilter => {
    this.setState(state => {
      const { variants } = this.props
      const { sortKey, sortOrder } = state
      const renderedVariants = sortVariants(
        mergeExomeAndGenomeData(filterVariants(variants, newFilter)),
        {
          sortKey,
          sortOrder,
        }
      )
      return {
        filter: newFilter,
        renderedVariants,
      }
    })
  }

  onSort = newSortKey => {
    this.setState(state => {
      const { renderedVariants, sortKey } = state

      let newSortOrder = 'descending'
      if (newSortKey === sortKey) {
        newSortOrder = state.sortOrder === 'ascending' ? 'descending' : 'ascending'
      }

      // Since the filter hasn't changed, sort the currently rendered variants instead
      // of filtering the input variants.
      const sortedVariants = sortVariants(renderedVariants, {
        sortKey: newSortKey,
        sortOrder: newSortOrder,
      })

      return {
        renderedVariants: sortedVariants,
        sortKey: newSortKey,
        sortOrder: newSortOrder,
      }
    })
  }

  onHoverVariantInTable = variantId => {
    this.setState({ variantHoveredInTable: variantId })
  }

  onVisibleRowsChange = throttle(({ startIndex, stopIndex }) => {
    this.setState({ visibleVariantWindow: [startIndex, stopIndex] })
  }, 100)

  onNavigatorClick = position => {
    const { renderedVariants } = this.state
    const sortedVariants = sortVariants(renderedVariants, {
      sortKey: 'variant_id',
      sortOrder: 'ascending',
    })

    let index
    if (sortedVariants.length === 0 || position < sortedVariants[0].pos) {
      index = 0
    }

    index = sortedVariants.findIndex(
      (variant, i) =>
        sortedVariants[i + 1] && position >= variant.pos && position <= sortedVariants[i + 1].pos
    )

    if (index === -1) {
      index = sortedVariants.length - 1
    }

    this.setState({
      renderedVariants: sortedVariants,
      rowIndexLastClickedInNavigator: index,
      sortKey: 'variant_id',
      sortOrder: 'ascending',
    })
  }

  render() {
    const { clinVarVariants, datasetId, gene, width } = this.props
    const {
      filter,
      renderedVariants,
      rowIndexLastClickedInNavigator,
      sortKey,
      sortOrder,
      variantHoveredInTable,
      visibleVariantWindow,
    } = this.state

    const datasetLabel = datasetLabels[datasetId]

    return (
      <div>
        <ClinVarTrack variants={clinVarVariants} variantFilter={filter.includeCategories} />

        <VariantTrack
          title={`${datasetLabel}\n(${renderedVariants.length})`}
          variants={renderedVariants}
        />

        <Cursor onClick={this.onNavigatorClick}>
          <VariantTrack
            title="Viewing in table"
            variants={renderedVariants
              .slice(visibleVariantWindow[0], visibleVariantWindow[1] + 1)
              .map(variant => ({
                ...variant,
                isHighlighted: variant.variant_id === variantHoveredInTable,
              }))}
          />
        </Cursor>

        <PositionAxisTrack />

        <TrackPageSection style={{ fontSize: '14px', marginTop: '1em' }}>
          <VariantFilterControls onChange={this.onFilter} value={filter} />
          <div>
            <ExportVariantsButton
              datasetId={datasetId}
              exportFileName={`${datasetLabel}_${gene.gene_id}`}
              variants={renderedVariants}
            />
          </div>
          <p>
            Only variants located in or within 75 base pairs of a coding exon are shown here. To see
            intronic variants, use the{' '}
            <Link to={`/region/${gene.chrom}-${gene.start}-${gene.stop}`}>region view</Link>.
          </p>
          <p>† denotes a consequence that is for a non-canonical transcript</p>
          <VariantTable
            columns={this.getColumns(width, gene.chrom)}
            highlightText={filter.searchText}
            onHoverVariant={this.onHoverVariantInTable}
            onRequestSort={this.onSort}
            onVisibleRowsChange={this.onVisibleRowsChange}
            rowIndexLastClickedInNavigator={rowIndexLastClickedInNavigator}
            sortKey={sortKey}
            sortOrder={sortOrder}
            variants={renderedVariants}
          />
        </TrackPageSection>
      </div>
    )
  }
}

const query = `
query VariantsInGene($geneId: String!, $datasetId: DatasetId!) {
  gene(gene_id: $geneId) {
    clinvar_variants {
      allele_id
      clinical_significance
      consequence
      gold_stars
      pos
      variantId
    }
    variants(dataset: $datasetId) {
      consequence
      isCanon: consequence_in_canonical_transcript
      flags
      hgvs
      hgvsc
      hgvsp
      lof
      lof_filter
      lof_flags
      pos
      rsid
      variant_id: variantId
      xpos
      exome {
        ac
        ac_hemi
        ac_hom
        an
        af
        filters
        populations {
          id
          ac
          an
          ac_hemi
          ac_hom
        }
      }
      genome {
        ac
        ac_hemi
        ac_hom
        an
        af
        filters
        populations {
          id
          ac
          an
          ac_hemi
          ac_hom
        }
      }
    }
  }
}`

const ConnectedVariantsInGene = ({ datasetId, gene, width }) => (
  <Query query={query} variables={{ datasetId, geneId: gene.gene_id }}>
    {({ data, error, loading }) => {
      if (loading) {
        return <StatusMessage>Loading variants...</StatusMessage>
      }

      if (error || !((data || {}).gene || {}).variants) {
        return <StatusMessage>Failed to load variants</StatusMessage>
      }

      return (
        <VariantsInGene
          clinVarVariants={data.gene.clinvar_variants}
          datasetId={datasetId}
          gene={gene}
          variants={data.gene.variants}
          width={width}
        />
      )
    }}
  </Query>
)

ConnectedVariantsInGene.propTypes = {
  datasetId: PropTypes.string.isRequired,
  gene: PropTypes.shape({
    gene_id: PropTypes.string.isRequired,
  }).isRequired,
  width: PropTypes.number.isRequired,
}

export default ConnectedVariantsInGene
