import {
  isRegionId,
  isVariantId,
  normalizeVariantId,
  parseRegionId,
  isRsId,
} from '@gnomad/identifiers'

import { referenceGenomeForDataset } from './datasets'

const STRUCTURAL_VARIANT_ID_REGEX = /^(BND|CPX|CTX|DEL|DUP|INS|INV|MCNV|OTH)_(\d+|X|Y)_([1-9][0-9]*)$/i
const isStructuralVariantId = str => {
  const match = STRUCTURAL_VARIANT_ID_REGEX.exec(str)
  if (!match) {
    return false
  }

  const chrom = match[2]
  const chromNumber = Number(chrom)
  if (!Number.isNaN(chromNumber) && (chromNumber < 1 || chromNumber > 22)) {
    return false
  }

  const id = Number(match[3])
  if (id > 1e9) {
    return false
  }

  return true
}

export const fetchSearchResults = (dataset, query) => {
  if (dataset.startsWith('gnomad_sv')) {
    // ==============================================================================================
    // Structural Variants
    // ==============================================================================================

    if (isStructuralVariantId(query)) {
      const structuralVariantId = query.toUpperCase()
      return Promise.resolve([
        {
          label: structuralVariantId,
          value: `/variant/${structuralVariantId}?dataset=${dataset}`,
        },
      ])
    }
  } else {
    // ==============================================================================================
    // Variants
    // ==============================================================================================

    if (isVariantId(query)) {
      const variantId = normalizeVariantId(query)
      return Promise.resolve([
        {
          label: variantId,
          value: `/variant/${variantId}?dataset=${dataset}`,
        },
      ])
    }

    if (isRsId(query)) {
      const rsId = query
      return Promise.resolve([
        {
          label: rsId,
          value: `/variant/${rsId}?dataset=${dataset}`,
        },
      ])
    }
  }

  // ==============================================================================================
  // Region
  // ==============================================================================================

  if (isRegionId(query)) {
    const { chrom, start, stop } = parseRegionId(query)
    const regionId = `${chrom}-${start}-${stop}`
    const results = [
      {
        label: regionId,
        value: `/region/${regionId}?dataset=${dataset}`,
      },
    ]

    // If a position is entered, return options for a 40 base region centered
    // at the position and the position as a one base region.
    if (start === stop) {
      const windowRegionId = `${chrom}-${Math.max(1, start - 20)}-${stop + 20}`
      results.unshift({
        label: windowRegionId,
        value: `/region/${windowRegionId}?dataset=${dataset}`,
      })
    }

    return Promise.resolve(results)
  }

  // ==============================================================================================
  // Gene ID
  // ==============================================================================================

  const upperCaseQuery = query.toUpperCase()

  if (/^ENSG\d{11}$/.test(upperCaseQuery)) {
    const geneId = upperCaseQuery
    return Promise.resolve([
      {
        label: geneId,
        value: `/gene/${geneId}?dataset=${dataset}`,
      },
    ])
  }

  // ==============================================================================================
  // Transcript ID
  // ==============================================================================================

  if (/^ENST\d{11}$/.test(upperCaseQuery)) {
    const transcriptId = upperCaseQuery
    return Promise.resolve([
      {
        label: transcriptId,
        value: `/transcript/${transcriptId}?dataset=${dataset}`,
      },
    ])
  }

  // ==============================================================================================
  // Gene symbol
  // ==============================================================================================

  return fetch('/api/', {
    body: JSON.stringify({
      query: `
        query GeneSearch($query: String!, $referenceGenome: ReferenceGenomeId!) {
          gene_search(query: $query, reference_genome: $referenceGenome) {
            ensembl_id
            symbol
          }
        }
      `,
      variables: { query, referenceGenome: referenceGenomeForDataset(dataset) },
    }),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
    .then(response => response.json())
    .then(response => {
      if (!response.data.gene_search) {
        throw new Error('Unable to retrieve search results')
      }

      const genes = response.data.gene_search

      const geneSymbolCounts = {}
      genes.forEach(gene => {
        if (geneSymbolCounts[gene.symbol] === undefined) {
          geneSymbolCounts[gene.symbol] = 0
        }
        geneSymbolCounts[gene.symbol] += 1
      })

      return genes.map(gene => ({
        label:
          geneSymbolCounts[gene.symbol] > 1 ? `${gene.symbol} (${gene.ensembl_id})` : gene.symbol,
        value: `/gene/${gene.ensembl_id}?dataset=${dataset}`,
      }))
    })
}